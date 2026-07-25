import request from 'supertest';
import Database, { prisma } from '../src/config/database';
import app from '../src/app';
import { resetDatabase } from './helpers/db';

const API = '/api/v1';

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

  describe('GET /health', () => {
    it('returns ok without auth', async () => {
      const res = await request(app).get(`${API}/health`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Auth + users table', () => {
    const password = 'SecurePass123!@#';

    it('registers a user and persists to the database', async () => {
      const email = `reg_${Date.now()}@example.com`;

      const res = await request(app).post(`${API}/auth/register`).send({
        email,
        password,
        firstName: 'Test',
        lastName: 'User',
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(email);
      expect(res.body.data.tokens.accessToken).toBeDefined();

      const row = await prisma.user.findUnique({ where: { email } });
      expect(row).not.toBeNull();
      expect(row!.password).not.toBe(password);
      expect(row!.firstName).toBe('Test');
    });

    it('logs in an existing user', async () => {
      const email = `login_${Date.now()}@example.com`;
      await request(app).post(`${API}/auth/register`).send({
        email,
        password,
        firstName: 'Login',
        lastName: 'User',
      });

      const res = await request(app).post(`${API}/auth/login`).send({ email, password });
      expect(res.status).toBe(200);
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('rejects invalid credentials', async () => {
      const email = `bad_${Date.now()}@example.com`;
      await request(app).post(`${API}/auth/register`).send({
        email,
        password,
        firstName: 'Bad',
        lastName: 'Login',
      });

      const res = await request(app)
        .post(`${API}/auth/login`)
        .send({ email, password: 'WrongPass1!@#' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Tasks + tasks table', () => {
    const password = 'SecurePass123!@#';
    let token: string;
    let userId: string;

    beforeEach(async () => {
      const email = `tasks_${Date.now()}@example.com`;
      const reg = await request(app).post(`${API}/auth/register`).send({
        email,
        password,
        firstName: 'Task',
        lastName: 'Owner',
      });
      token = reg.body.data.tokens.accessToken;
      userId = reg.body.data.user.id;
    });

    it('creates a task in the database', async () => {
      const res = await request(app)
        .post(`${API}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Integration task', priority: 'HIGH' });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Integration task');

      const row = await prisma.task.findUnique({ where: { id: res.body.data.id } });
      expect(row).not.toBeNull();
      expect(row!.createdById).toBe(userId);
      expect(row!.status).toBe('TODO');
    });

    it('lists only the owner tasks and updates status', async () => {
      const created = await request(app)
        .post(`${API}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Status task' });

      const taskId = created.body.data.id;

      const list = await request(app)
        .get(`${API}/tasks`)
        .set('Authorization', `Bearer ${token}`);

      expect(list.status).toBe(200);
      expect(list.body.data).toHaveLength(1);

      const updated = await request(app)
        .put(`${API}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'IN_PROGRESS' });

      expect(updated.status).toBe(200);
      expect(updated.body.data.status).toBe('IN_PROGRESS');

      const row = await prisma.task.findUnique({ where: { id: taskId } });
      expect(row!.status).toBe('IN_PROGRESS');
    });

    it('deletes a task from the database', async () => {
      const created = await request(app)
        .post(`${API}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Delete me' });

      const taskId = created.body.data.id;

      const del = await request(app)
        .delete(`${API}/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(del.status).toBe(200);
      expect(await prisma.task.findUnique({ where: { id: taskId } })).toBeNull();
    });

    it('requires auth for tasks', async () => {
      const res = await request(app).get(`${API}/tasks`);
      expect(res.status).toBe(401);
    });
  });
});
