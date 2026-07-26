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
  });

  describe('Teams (deferred)', () => {
    it('requires auth for teams base path', async () => {
      const res = await request(app).get(`${API}/teams`);
      expect(res.status).toBe(401);
    });

    it('has no implemented team handlers yet', async () => {
      const { token } = await registerUser();
      const res = await request(app).get(`${API}/teams`).set(authHeader(token!));
      // Router mounts auth but no handlers → Express 404
      expect(res.status).toBe(404);
    });
  });
});
