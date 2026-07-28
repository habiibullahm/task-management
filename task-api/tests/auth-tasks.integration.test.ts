import request from 'supertest';
import nodemailer from 'nodemailer';
import Database, { prisma } from '../src/config/database';
import app from '../src/app';
import { resetDatabase } from './helpers/db';
import { TEST_PASSWORD, authHeader, registerUser } from './helpers/auth';

const API = '/api/v1';

function clearMailerEnv(): void {
  process.env.SMTP_HOST = '';
  process.env.SMTP_PORT = '';
  process.env.SMTP_USER = '';
  process.env.SMTP_PASS = '';
  process.env.RESEND_API_KEY = '';
  process.env.EMAIL_FROM = '';
}

describe('API + DB integration', () => {
  beforeAll(async () => {
    await Database.connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('Root + health', () => {
    it('GET / returns friendly API info', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.health).toBe(`${API}/health`);
    });

    it('GET /health returns ok without auth', async () => {
      const res = await request(app).get(`${API}/health`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.db).toBe('ok');
    });
  });

  describe('Auth', () => {
    it('registers a user and persists to the database', async () => {
      const email = `reg_${Date.now()}@example.com`;
      const { res } = await registerUser({ email, firstName: 'Test' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(email);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();

      const row = await prisma.user.findUnique({ where: { email } });
      expect(row).not.toBeNull();
      expect(row!.password).not.toBe(TEST_PASSWORD);
      expect(row!.firstName).toBe('Test');
    });

    it('logs in an existing user', async () => {
      const { email, password } = await registerUser({ firstName: 'Login' });
      const res = await request(app).post(`${API}/auth/login`).send({ email, password });

      expect(res.status).toBe(200);
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(email);
    });

    it('rejects invalid credentials', async () => {
      const { email } = await registerUser({ firstName: 'Bad' });
      const res = await request(app)
        .post(`${API}/auth/login`)
        .send({ email, password: 'WrongPass1!@#' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects duplicate email registration', async () => {
      const email = `dup_${Date.now()}@example.com`;
      await registerUser({ email, firstName: 'One' });

      const { res } = await registerUser({ email, firstName: 'Two' });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(await prisma.user.count({ where: { email } })).toBe(1);
    });

    it('rejects weak password on register', async () => {
      const { res } = await registerUser({
        email: `weak_${Date.now()}@example.com`,
        password: 'weak',
        firstName: 'Weak',
      });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('returns profile for authenticated user', async () => {
      const { token, email, userId } = await registerUser({ firstName: 'Profile' });
      const res = await request(app).get(`${API}/auth/profile`).set(authHeader(token!));

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(userId);
      expect(res.body.data.email).toBe(email);
      expect(res.body.data.password).toBeUndefined();
    });

    it('requires auth for profile', async () => {
      const res = await request(app).get(`${API}/auth/profile`);
      expect(res.status).toBe(401);
    });

    it('refreshes access token with refresh token', async () => {
      const { refreshToken } = await registerUser();
      const res = await request(app)
        .post(`${API}/auth/refresh`)
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('rejects invalid refresh token', async () => {
      const res = await request(app)
        .post(`${API}/auth/refresh`)
        .send({ refreshToken: 'not-a-valid-token' });
      expect(res.status).toBe(401);
    });

    it('changes password when current password is correct', async () => {
      const { token, email, password } = await registerUser({ firstName: 'Change' });
      const newPassword = 'NewSecurePass123!@#';

      const changeRes = await request(app)
        .post(`${API}/auth/change-password`)
        .set(authHeader(token!))
        .send({ currentPassword: password, newPassword });
      expect(changeRes.status).toBe(200);

      const oldLogin = await request(app).post(`${API}/auth/login`).send({ email, password });
      expect(oldLogin.status).toBe(401);

      const newLogin = await request(app)
        .post(`${API}/auth/login`)
        .send({ email, password: newPassword });
      expect(newLogin.status).toBe(200);
    });

    it('rejects change-password with wrong current password', async () => {
      const { token } = await registerUser({ firstName: 'WrongCurrent' });
      const res = await request(app)
        .post(`${API}/auth/change-password`)
        .set(authHeader(token!))
        .send({ currentPassword: 'WrongPass1!@#', newPassword: 'NewSecurePass123!@#' });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/current password/i);
    });

    it('forgot-password is generic and reset-password updates credentials', async () => {
      clearMailerEnv();
      const { email } = await registerUser({ firstName: 'Reset' });
      const forgotUnknown = await request(app)
        .post(`${API}/auth/forgot-password`)
        .send({ email: 'nobody_exists@example.com' });
      expect(forgotUnknown.status).toBe(200);
      expect(forgotUnknown.body.message).toMatch(/if an account exists/i);
      expect(forgotUnknown.body.data.emailSent).toBe(false);

      const forgot = await request(app).post(`${API}/auth/forgot-password`).send({ email });
      expect(forgot.status).toBe(200);
      expect(forgot.body.message).toMatch(/if an account exists/i);
      expect(forgot.body.data.emailSent).toBe(false);
      expect(forgot.body.data.devResetUrl).toBeUndefined();
      expect(forgot.body.data.emailError).toBeUndefined();
      const resetToken = forgot.body.data?.resetToken as string;
      expect(resetToken).toBeTruthy();

      const newPassword = 'ResetSecurePass123!@#';
      const resetRes = await request(app)
        .post(`${API}/auth/reset-password`)
        .send({ token: resetToken, newPassword });
      expect(resetRes.status).toBe(200);

      const loginRes = await request(app)
        .post(`${API}/auth/login`)
        .send({ email, password: newPassword });
      expect(loginRes.status).toBe(200);

      const reuse = await request(app)
        .post(`${API}/auth/reset-password`)
        .send({ token: resetToken, newPassword: 'AnotherSecurePass123!@#' });
      expect(reuse.status).toBe(400);
    });

    it('forgot-password sends Resend email when RESEND_API_KEY is set', async () => {
      const { email } = await registerUser({ firstName: 'Mail' });
      clearMailerEnv();
      process.env.RESEND_API_KEY = 're_test_key';
      process.env.EMAIL_FROM = 'Task Management <onboarding@resend.dev>';
      process.env.APP_URL = 'http://localhost:3000';

      const fetchMock = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => 'ok',
      });
      const originalFetch = global.fetch;
      global.fetch = fetchMock as unknown as typeof fetch;

      try {
        const forgot = await request(app).post(`${API}/auth/forgot-password`).send({ email });
        expect(forgot.status).toBe(200);
        expect(forgot.body.data.emailSent).toBe(true);
        expect(forgot.body.data.resetToken).toBeTruthy();
        expect(forgot.body.data.devResetUrl).toBeUndefined();
        expect(forgot.body.data.emailError).toBeUndefined();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe('https://api.resend.com/emails');
        expect(init.method).toBe('POST');
        expect((init.headers as Record<string, string>).Authorization).toBe('Bearer re_test_key');
        const body = JSON.parse(String(init.body));
        expect(body.to).toEqual([email]);
        expect(body.subject).toMatch(/reset/i);
        expect(body.html).toMatch(/Reset password/);
        expect(body.text).toMatch(/reset-password\?token=/);
        expect(body.html).toMatch(/http:\/\/localhost:3000\/reset-password\?token=/);
      } finally {
        global.fetch = originalFetch;
        clearMailerEnv();
      }
    });

    it('forgot-password prefers SMTP when SMTP_* is configured', async () => {
      const { email } = await registerUser({ firstName: 'Smtp' });
      clearMailerEnv();
      process.env.SMTP_HOST = 'smtp.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_USER = 'smtp-user@example.com';
      process.env.SMTP_PASS = 'smtp-pass';
      process.env.EMAIL_FROM = 'Task Management <smtp-user@example.com>';
      process.env.APP_URL = 'http://localhost:3000';
      // Even if Resend is set, SMTP should win
      process.env.RESEND_API_KEY = 're_should_not_be_used';

      const sendMail = jest.fn().mockResolvedValue({ messageId: 'smtp-test-id' });
      const createTransportSpy = jest
        .spyOn(nodemailer, 'createTransport')
        .mockReturnValue({ sendMail } as unknown as ReturnType<typeof nodemailer.createTransport>);

      const fetchMock = jest.fn();
      const originalFetch = global.fetch;
      global.fetch = fetchMock as unknown as typeof fetch;

      try {
        const forgot = await request(app).post(`${API}/auth/forgot-password`).send({ email });
        expect(forgot.status).toBe(200);
        expect(forgot.body.data.emailSent).toBe(true);
        expect(forgot.body.data.resetToken).toBeTruthy();
        expect(createTransportSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            host: 'smtp.example.com',
            port: 587,
            auth: { user: 'smtp-user@example.com', pass: 'smtp-pass' },
          })
        );
        expect(sendMail).toHaveBeenCalledTimes(1);
        expect(sendMail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: email,
            from: 'Task Management <smtp-user@example.com>',
            subject: expect.stringMatching(/reset/i),
            text: expect.stringMatching(/reset-password\?token=/),
            html: expect.stringMatching(/http:\/\/localhost:3000\/reset-password\?token=/),
          })
        );
        expect(fetchMock).not.toHaveBeenCalled();
      } finally {
        createTransportSpy.mockRestore();
        global.fetch = originalFetch;
        clearMailerEnv();
      }
    });

    it('lists tasks sorted by dueDate when requested', async () => {
      const { token } = await registerUser({ firstName: 'Sort' });
      await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(token!))
        .send({ title: 'Later due', dueDate: '2030-12-01' });
      await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(token!))
        .send({ title: 'Sooner due', dueDate: '2030-01-01' });

      const res = await request(app)
        .get(`${API}/tasks?sort=dueDate&limit=50`)
        .set(authHeader(token!));
      expect(res.status).toBe(200);
      const titles = (res.body.data as Array<{ title: string }>).map((t) => t.title);
      expect(titles.indexOf('Sooner due')).toBeLessThan(titles.indexOf('Later due'));
    });
  });

  describe('Auth logout', () => {
    it('logs out when authenticated', async () => {
      const { token } = await registerUser();
      const res = await request(app).post(`${API}/auth/logout`).set(authHeader(token!));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('requires auth for logout', async () => {
      const res = await request(app).post(`${API}/auth/logout`);
      expect(res.status).toBe(401);
    });
  });

  describe('Tasks', () => {
    let token: string;
    let userId: string;

    beforeEach(async () => {
      const registered = await registerUser({ firstName: 'Task', lastName: 'Owner' });
      token = registered.token!;
      userId = registered.userId!;
    });

    it('creates a task in the database', async () => {
      const res = await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(token))
        .send({
          title: 'Integration task',
          description: 'Details',
          priority: 'HIGH',
          dueDate: '2026-12-31T00:00:00.000Z',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Integration task');
      expect(res.body.data.priority).toBe('HIGH');

      const row = await prisma.task.findUnique({ where: { id: res.body.data.id } });
      expect(row).not.toBeNull();
      expect(row!.createdById).toBe(userId);
      expect(row!.status).toBe('TODO');
      expect(row!.description).toBe('Details');
    });

    it('gets a task by id for the owner', async () => {
      const created = await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(token))
        .send({ title: 'Fetch me' });

      const res = await request(app)
        .get(`${API}/tasks/${created.body.data.id}`)
        .set(authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Fetch me');
    });

    it('returns 404 for missing task', async () => {
      const res = await request(app)
        .get(`${API}/tasks/00000000-0000-4000-8000-000000000000`)
        .set(authHeader(token));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('lists only the owner tasks and updates fields', async () => {
      const created = await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(token))
        .send({ title: 'Status task' });
      const taskId = created.body.data.id;

      const list = await request(app).get(`${API}/tasks`).set(authHeader(token));
      expect(list.status).toBe(200);
      expect(list.body.data).toHaveLength(1);
      expect(list.body.meta.total).toBe(1);

      const updated = await request(app)
        .put(`${API}/tasks/${taskId}`)
        .set(authHeader(token))
        .send({
          title: 'Renamed task',
          status: 'IN_PROGRESS',
          priority: 'URGENT',
          description: 'Updated desc',
        });

      expect(updated.status).toBe(200);
      expect(updated.body.data.title).toBe('Renamed task');
      expect(updated.body.data.status).toBe('IN_PROGRESS');
      expect(updated.body.data.priority).toBe('URGENT');

      const row = await prisma.task.findUnique({ where: { id: taskId } });
      expect(row!.status).toBe('IN_PROGRESS');
      expect(row!.title).toBe('Renamed task');
    });

    it('filters tasks by status and search', async () => {
      await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(token))
        .send({ title: 'Alpha todo', status: 'TODO' });
      await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(token))
        .send({ title: 'Beta progress', status: 'IN_PROGRESS' });

      const byStatus = await request(app)
        .get(`${API}/tasks`)
        .query({ status: 'IN_PROGRESS' })
        .set(authHeader(token));
      expect(byStatus.status).toBe(200);
      expect(byStatus.body.data).toHaveLength(1);
      expect(byStatus.body.data[0].title).toBe('Beta progress');

      const bySearch = await request(app)
        .get(`${API}/tasks`)
        .query({ search: 'Alpha' })
        .set(authHeader(token));
      expect(bySearch.status).toBe(200);
      expect(bySearch.body.data).toHaveLength(1);
      expect(bySearch.body.data[0].title).toBe('Alpha todo');
    });

    it('filters tasks by priority', async () => {
      await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(token))
        .send({ title: 'High one', priority: 'HIGH' });
      await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(token))
        .send({ title: 'Low one', priority: 'LOW' });

      const res = await request(app)
        .get(`${API}/tasks`)
        .query({ priority: 'HIGH' })
        .set(authHeader(token));
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('High one');
      expect(res.body.data[0].priority).toBe('HIGH');
    });

    it('rejects invalid sort query', async () => {
      const res = await request(app)
        .get(`${API}/tasks`)
        .query({ sort: 'priority' })
        .set(authHeader(token));
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/sort/i);
    });

    it('rejects invalid status on create', async () => {
      const res = await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(token))
        .send({ title: 'Bad status', status: 'NOT_A_STATUS' });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('deletes a task from the database', async () => {
      const created = await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(token))
        .send({ title: 'Delete me' });
      const taskId = created.body.data.id;

      const del = await request(app)
        .delete(`${API}/tasks/${taskId}`)
        .set(authHeader(token));

      expect(del.status).toBe(200);
      expect(await prisma.task.findUnique({ where: { id: taskId } })).toBeNull();
    });

    it('requires auth for tasks', async () => {
      const res = await request(app).get(`${API}/tasks`);
      expect(res.status).toBe(401);
    });

    it('rejects create task without title', async () => {
      const res = await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(token))
        .send({ description: 'no title' });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
      expect(await prisma.task.count()).toBe(0);
    });

    it('forbids access to another users task', async () => {
      const created = await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(token))
        .send({ title: 'Private task' });
      const taskId = created.body.data.id;

      const other = await registerUser({ firstName: 'Other' });
      const otherToken = other.token!;

      const getRes = await request(app)
        .get(`${API}/tasks/${taskId}`)
        .set(authHeader(otherToken));
      expect(getRes.status).toBe(403);

      const putRes = await request(app)
        .put(`${API}/tasks/${taskId}`)
        .set(authHeader(otherToken))
        .send({ title: 'Hijack' });
      expect(putRes.status).toBe(403);

      const delRes = await request(app)
        .delete(`${API}/tasks/${taskId}`)
        .set(authHeader(otherToken));
      expect(delRes.status).toBe(403);

      expect(await prisma.task.findUnique({ where: { id: taskId } })).not.toBeNull();
    });

    it('attaches team and assignee with validation and filters', async () => {
      const member = await registerUser({ firstName: 'Member' });
      const stranger = await registerUser({ firstName: 'Stranger' });

      const teamRes = await request(app)
        .post(`${API}/teams`)
        .set(authHeader(token))
        .send({ name: 'Task Team' });
      const teamId = teamRes.body.data.id as string;

      await request(app)
        .post(`${API}/teams/${teamId}/members`)
        .set(authHeader(token))
        .send({ userId: member.userId, role: 'MEMBER' });

      const created = await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(token))
        .send({
          title: 'Team task',
          teamId,
          assignedToId: member.userId,
        });
      expect(created.status).toBe(201);
      expect(created.body.data.teamId).toBe(teamId);
      expect(created.body.data.assignedToId).toBe(member.userId);
      expect(created.body.data.team.name).toBe('Task Team');

      // Assignee who is not on the team is rejected
      const badAssignee = await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(token))
        .send({
          title: 'Bad assignee',
          teamId,
          assignedToId: stranger.userId,
        });
      expect(badAssignee.status).toBe(400);

      // Non-member cannot attach a foreign team
      const foreignTeam = await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(stranger.token!))
        .send({ title: 'No access', teamId });
      expect(foreignTeam.status).toBe(403);

      // Member can see the team task
      const memberList = await request(app)
        .get(`${API}/tasks`)
        .set(authHeader(member.token!));
      expect(memberList.status).toBe(200);
      expect(memberList.body.data.some((t: { id: string }) => t.id === created.body.data.id)).toBe(
        true
      );

      const byTeam = await request(app)
        .get(`${API}/tasks`)
        .query({ teamId })
        .set(authHeader(token));
      expect(byTeam.status).toBe(200);
      expect(byTeam.body.data).toHaveLength(1);
      expect(byTeam.body.data[0].title).toBe('Team task');

      const byAssignee = await request(app)
        .get(`${API}/tasks`)
        .query({ assignedToId: member.userId })
        .set(authHeader(token));
      expect(byAssignee.status).toBe(200);
      expect(byAssignee.body.data).toHaveLength(1);

      // Clear team + assignee
      const cleared = await request(app)
        .put(`${API}/tasks/${created.body.data.id}`)
        .set(authHeader(token))
        .send({ teamId: null, assignedToId: null });
      expect(cleared.status).toBe(200);
      expect(cleared.body.data.teamId).toBeNull();
      expect(cleared.body.data.assignedToId).toBeNull();
    });
  });

  describe('Teams', () => {
    it('requires auth for teams base path', async () => {
      const res = await request(app).get(`${API}/teams`);
      expect(res.status).toBe(401);
    });

    it('creates a team and lists it for the creator', async () => {
      const { token, userId } = await registerUser({ firstName: 'Owner' });

      const createRes = await request(app)
        .post(`${API}/teams`)
        .set(authHeader(token!))
        .send({ name: 'Alpha Team', description: 'First team' });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.name).toBe('Alpha Team');
      expect(createRes.body.data.createdById).toBe(userId);
      expect(createRes.body.data.members).toHaveLength(1);
      expect(createRes.body.data.members[0].role).toBe('OWNER');
      expect(createRes.body.data.members[0].userId).toBe(userId);

      const listRes = await request(app).get(`${API}/teams`).set(authHeader(token!));
      expect(listRes.status).toBe(200);
      expect(listRes.body.data).toHaveLength(1);
      expect(listRes.body.data[0].id).toBe(createRes.body.data.id);

      const row = await prisma.team.findUnique({
        where: { id: createRes.body.data.id },
        include: { members: true },
      });
      expect(row).not.toBeNull();
      expect(row!.members).toHaveLength(1);
    });

    it('updates and deletes a team as OWNER', async () => {
      const { token } = await registerUser();
      const created = await request(app)
        .post(`${API}/teams`)
        .set(authHeader(token!))
        .send({ name: 'Rename Me' });
      const teamId = created.body.data.id as string;

      const updateRes = await request(app)
        .put(`${API}/teams/${teamId}`)
        .set(authHeader(token!))
        .send({ name: 'Renamed', description: 'Updated' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('Renamed');
      expect(updateRes.body.data.description).toBe('Updated');

      const deleteRes = await request(app)
        .delete(`${API}/teams/${teamId}`)
        .set(authHeader(token!));
      expect(deleteRes.status).toBe(200);

      const listRes = await request(app).get(`${API}/teams`).set(authHeader(token!));
      expect(listRes.body.data).toHaveLength(0);
      expect(await prisma.team.count()).toBe(0);
    });

    it('adds, lists, updates role, and removes members', async () => {
      const owner = await registerUser({ firstName: 'Owner' });
      const member = await registerUser({ firstName: 'Member' });

      const created = await request(app)
        .post(`${API}/teams`)
        .set(authHeader(owner.token!))
        .send({ name: 'Collab' });
      const teamId = created.body.data.id as string;

      const addRes = await request(app)
        .post(`${API}/teams/${teamId}/members`)
        .set(authHeader(owner.token!))
        .send({ userId: member.userId, role: 'MEMBER' });
      expect(addRes.status).toBe(201);
      expect(addRes.body.data.userId).toBe(member.userId);
      expect(addRes.body.data.role).toBe('MEMBER');
      const membershipId = addRes.body.data.id as string;

      const listMembersRes = await request(app)
        .get(`${API}/teams/${teamId}/members`)
        .set(authHeader(owner.token!));
      expect(listMembersRes.status).toBe(200);
      expect(listMembersRes.body.data).toHaveLength(2);

      // Member can see the team
      const memberList = await request(app)
        .get(`${API}/teams`)
        .set(authHeader(member.token!));
      expect(memberList.body.data).toHaveLength(1);

      const roleRes = await request(app)
        .put(`${API}/teams/${teamId}/members/${membershipId}`)
        .set(authHeader(owner.token!))
        .send({ role: 'ADMIN' });
      expect(roleRes.status).toBe(200);
      expect(roleRes.body.data.role).toBe('ADMIN');

      const removeRes = await request(app)
        .delete(`${API}/teams/${teamId}/members/${membershipId}`)
        .set(authHeader(owner.token!));
      expect(removeRes.status).toBe(200);

      const afterRemove = await request(app)
        .get(`${API}/teams/${teamId}/members`)
        .set(authHeader(owner.token!));
      expect(afterRemove.body.data).toHaveLength(1);
    });

    it('forbids non-members and blocks removing the last OWNER', async () => {
      const owner = await registerUser({ firstName: 'Owner' });
      const stranger = await registerUser({ firstName: 'Stranger' });

      const created = await request(app)
        .post(`${API}/teams`)
        .set(authHeader(owner.token!))
        .send({ name: 'Private' });
      const teamId = created.body.data.id as string;
      const ownerMembershipId = created.body.data.members[0].id as string;

      const forbidden = await request(app)
        .get(`${API}/teams/${teamId}`)
        .set(authHeader(stranger.token!));
      expect(forbidden.status).toBe(403);

      const removeOwner = await request(app)
        .delete(`${API}/teams/${teamId}/members/${ownerMembershipId}`)
        .set(authHeader(owner.token!));
      expect(removeOwner.status).toBe(400);
    });

    it('rejects duplicate membership and unknown user', async () => {
      const owner = await registerUser();
      const other = await registerUser();

      const created = await request(app)
        .post(`${API}/teams`)
        .set(authHeader(owner.token!))
        .send({ name: 'Dup Check' });
      const teamId = created.body.data.id as string;

      await request(app)
        .post(`${API}/teams/${teamId}/members`)
        .set(authHeader(owner.token!))
        .send({ userId: other.userId });

      const dup = await request(app)
        .post(`${API}/teams/${teamId}/members`)
        .set(authHeader(owner.token!))
        .send({ userId: other.userId });
      expect(dup.status).toBe(409);

      const missing = await request(app)
        .post(`${API}/teams/${teamId}/members`)
        .set(authHeader(owner.token!))
        .send({ userId: '00000000-0000-4000-8000-000000000099' });
      expect(missing.status).toBe(404);
    });
  });

  describe('Comments', () => {
    it('creates, lists, updates, and deletes comments on an accessible task', async () => {
      const owner = await registerUser({ firstName: 'Owner' });
      const stranger = await registerUser({ firstName: 'Stranger' });

      const taskRes = await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(owner.token!))
        .send({ title: 'Commented task' });
      const taskId = taskRes.body.data.id as string;

      const createRes = await request(app)
        .post(`${API}/comments`)
        .set(authHeader(owner.token!))
        .send({ taskId, content: 'First note' });
      expect(createRes.status).toBe(201);
      expect(createRes.body.data.content).toBe('First note');
      expect(createRes.body.data.userId).toBe(owner.userId);
      expect(createRes.body.data.user.firstName).toBe('Owner');
      const commentId = createRes.body.data.id as string;

      const listRes = await request(app)
        .get(`${API}/tasks/${taskId}/comments`)
        .set(authHeader(owner.token!));
      expect(listRes.status).toBe(200);
      expect(listRes.body.data).toHaveLength(1);
      expect(listRes.body.data[0].id).toBe(commentId);

      const updateRes = await request(app)
        .put(`${API}/comments/${commentId}`)
        .set(authHeader(owner.token!))
        .send({ content: 'Updated note' });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.content).toBe('Updated note');

      // Stranger cannot list or comment
      const forbiddenList = await request(app)
        .get(`${API}/tasks/${taskId}/comments`)
        .set(authHeader(stranger.token!));
      expect(forbiddenList.status).toBe(403);

      const forbiddenCreate = await request(app)
        .post(`${API}/comments`)
        .set(authHeader(stranger.token!))
        .send({ taskId, content: 'Nope' });
      expect(forbiddenCreate.status).toBe(403);

      // Stranger cannot edit/delete owner's comment
      const forbiddenEdit = await request(app)
        .put(`${API}/comments/${commentId}`)
        .set(authHeader(stranger.token!))
        .send({ content: 'Hijack' });
      expect(forbiddenEdit.status).toBe(403);

      const deleteRes = await request(app)
        .delete(`${API}/comments/${commentId}`)
        .set(authHeader(owner.token!));
      expect(deleteRes.status).toBe(200);
      expect(await prisma.comment.count({ where: { taskId } })).toBe(0);
    });

    it('rejects empty comment content', async () => {
      const { token } = await registerUser();
      const taskRes = await request(app)
        .post(`${API}/tasks`)
        .set(authHeader(token!))
        .send({ title: 'Empty comment task' });

      const res = await request(app)
        .post(`${API}/comments`)
        .set(authHeader(token!))
        .send({ taskId: taskRes.body.data.id, content: '   ' });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });
});
