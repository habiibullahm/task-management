import { expect, type Page } from '@playwright/test';

export const E2E_PASSWORD = 'SecurePass123!@#';

export function uniqueEmail(prefix = 'e2e') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;
}

export async function registerViaUi(
  page: Page,
  opts: { email?: string; password?: string; firstName?: string; lastName?: string } = {}
) {
  const email = opts.email ?? uniqueEmail();
  const password = opts.password ?? E2E_PASSWORD;

  await page.goto('/register');
  await page.getByLabel('First Name').fill(opts.firstName ?? 'E2E');
  await page.getByLabel('Last Name').fill(opts.lastName ?? 'User');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);

  const [reg] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/auth/register') && res.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Create account', exact: true }).click(),
  ]);
  expect(reg.status(), await reg.text()).toBe(201);
  await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });

  return { email, password };
}

export async function loginViaUi(page: Page, email: string, password = E2E_PASSWORD) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);

  const [res] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/auth/login') && res.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Sign in', exact: true }).click(),
  ]);
  return res;
}

export async function createTaskViaUi(
  page: Page,
  data: { title: string; description?: string; priority?: string; status?: string }
) {
  await page.goto('/tasks/new');
  await page.getByLabel('Title').fill(data.title);
  if (data.description) {
    await page.getByLabel('Description').fill(data.description);
  }
  if (data.priority) {
    await page.locator('#priority').selectOption(data.priority);
  }
  if (data.status) {
    await page.locator('#status').selectOption(data.status);
  }

  const [created] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/tasks') && res.request().method() === 'POST'
    ),
    page.getByRole('button', { name: /create task/i }).click(),
  ]);
  expect(created.status(), await created.text()).toBe(201);
  await expect(page).toHaveURL(/\/tasks$/);
  return created;
}
