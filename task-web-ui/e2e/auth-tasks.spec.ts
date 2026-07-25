import { test, expect } from '@playwright/test';

test.describe('Task Management UI + API + DB', () => {
  test('register, create task, see it in My Tasks', async ({ page }) => {
    const email = `e2e_${Date.now()}@example.com`;
    const password = 'SecurePass123!@#';

    await page.goto('/register');
    await page.getByLabel('First Name').fill('E2E');
    await page.getByLabel('Last Name').fill('User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);

    const registerResponse = page.waitForResponse(
      (res) => res.url().includes('/auth/register') && res.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /create account/i }).click();
    const reg = await registerResponse;
    expect(reg.status(), await reg.text()).toBe(201);

    await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 });
    await expect(page.getByText(/welcome back/i)).toBeVisible();

    await page.getByRole('button', { name: 'Create Task' }).click();
    await expect(page).toHaveURL(/tasks\/new/);

    await page.getByLabel('Title').fill('E2E live task');
    await page.getByLabel('Description').fill('Created by Playwright against real API/DB');

    const createResponse = page.waitForResponse(
      (res) => res.url().includes('/tasks') && res.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /create task/i }).click();
    const created = await createResponse;
    expect(created.status(), await created.text()).toBe(201);

    await expect(page).toHaveURL(/\/tasks$/);
    await expect(page.getByText('E2E live task')).toBeVisible();
  });

  test('login rejects bad password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('nobody@example.com');
    await page.getByLabel('Password', { exact: true }).fill('WrongPass1!@#');

    const loginResponse = page.waitForResponse(
      (res) => res.url().includes('/auth/login') && res.request().method() === 'POST'
    );
    await page.getByRole('button', { name: /sign in/i }).click();
    const res = await loginResponse;
    expect(res.status()).toBe(401);
    await expect(page).toHaveURL(/login/);
  });
});
