import request from 'supertest';
import app from '../../src/app';

const API = '/api/v1';
export const TEST_PASSWORD = 'SecurePass123!@#';

export async function registerUser(overrides: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
} = {}) {
  const email = overrides.email ?? `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = overrides.password ?? TEST_PASSWORD;

  const res = await request(app)
    .post(`${API}/auth/register`)
    .send({
      email,
      password,
      firstName: overrides.firstName ?? 'Test',
      lastName: overrides.lastName ?? 'User',
    });

  return {
    res,
    email,
    password,
    token: res.body?.data?.tokens?.accessToken as string | undefined,
    refreshToken: res.body?.data?.tokens?.refreshToken as string | undefined,
    userId: res.body?.data?.user?.id as string | undefined,
  };
}

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
