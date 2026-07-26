import { test, expect } from '@playwright/test';
import {
  E2E_PASSWORD,
  createTaskViaUi,
  loginViaUi,
  registerViaUi,
  uniqueEmail,
} from './helpers';

test.describe('Auth', () => {
  test('register lands on dashboard', async ({ page }) => {
    await registerViaUi(page, { firstName: 'Reg' });
    await expect(page.getByText(/welcome back, reg/i)).toBeVisible();
  });

  test('login succeeds for existing user', async ({ page }) => {
    const { email, password } = await registerViaUi(page);
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/login/);

    const res = await loginViaUi(page, email, password);
    expect(res.status()).toBe(200);
    await expect(page).toHaveURL(/dashboard/);
  });

  test('login rejects bad password', async ({ page }) => {
    const res = await loginViaUi(page, 'nobody@example.com', 'WrongPass1!@#');
    expect(res.status()).toBe(401);
    await expect(page).toHaveURL(/login/);
  });

  test('protected routes redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);

    await page.goto('/tasks');
    await expect(page).toHaveURL(/login/);

    await page.goto('/tasks/new');
    await expect(page).toHaveURL(/login/);
  });

  test('logout returns to login and blocks dashboard', async ({ page }) => {
    await registerViaUi(page);
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/login/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Dashboard', () => {
  test('shows task stats and quick actions', async ({ page }) => {
    await registerViaUi(page, { firstName: 'Dash' });
    await createTaskViaUi(page, { title: 'Stat task', status: 'IN_PROGRESS' });

    await page.goto('/dashboard');
    await expect(page.getByText(/welcome back, dash/i)).toBeVisible();
    await expect(page.getByText('Total Tasks')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Task' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'My Tasks' })).toBeVisible();

    // Stats cards render total / in-progress counts from fetched tasks
    await expect(page.locator('p.text-4xl.font-bold').first()).toHaveText('1', { timeout: 10_000 });
    await expect(page.locator('p.text-4xl.font-bold').nth(1)).toHaveText('1');

    await page.getByRole('button', { name: 'My Tasks' }).click();
    await expect(page).toHaveURL(/\/tasks$/);

    await page.goto('/dashboard');
    await page.getByRole('button', { name: 'Manage Teams' }).click();
    await expect(page.getByText(/teams coming/i)).toBeVisible();
  });
});

test.describe('Tasks', () => {
  test('create task and see it in My Tasks', async ({ page }) => {
    await registerViaUi(page);
    await createTaskViaUi(page, {
      title: 'E2E live task',
      description: 'Created by Playwright against real API/DB',
      priority: 'HIGH',
    });
    await expect(page.getByText('E2E live task')).toBeVisible();
    await expect(page.getByText(/priority: high/i)).toBeVisible();
  });

  test('edit task title and details', async ({ page }) => {
    await registerViaUi(page);
    await createTaskViaUi(page, { title: 'Editable task' });

    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(page).toHaveURL(/\/tasks\/[^/]+$/);
    await expect(page.getByText('Edit Task', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Title')).toHaveValue('Editable task');

    await page.getByLabel('Title').fill('Edited task title');
    await page.getByLabel('Description').fill('Updated description');
    await page.locator('#status').selectOption('DONE');
    await page.locator('#priority').selectOption('LOW');

    const [updated] = await Promise.all([
      page.waitForResponse(
        (res) =>
          res.url().includes('/tasks/') &&
          res.request().method() === 'PUT' &&
          res.status() === 200
      ),
      page.getByRole('button', { name: 'Save changes' }).click(),
    ]);
    expect(updated.ok()).toBeTruthy();

    await expect(page).toHaveURL(/\/tasks$/);
    await expect(page.getByText('Edited task title')).toBeVisible();
    await expect(page.getByText(/priority: low/i)).toBeVisible();
  });

  test('change status from task list', async ({ page }) => {
    await registerViaUi(page);
    await createTaskViaUi(page, { title: 'Status from list' });

    const card = page.locator('div').filter({ hasText: 'Status from list' }).first();
    const select = page.locator('select').first();

    const [updated] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/tasks/') && res.request().method() === 'PUT'
      ),
      select.selectOption('IN_PROGRESS'),
    ]);
    expect(updated.status()).toBe(200);
    await expect(select).toHaveValue('IN_PROGRESS');
    await expect(card).toBeVisible();
  });

  test('filter by status and search', async ({ page }) => {
    await registerViaUi(page);
    await createTaskViaUi(page, { title: 'Alpha filter', status: 'TODO' });
    await createTaskViaUi(page, { title: 'Beta filter', status: 'IN_PROGRESS' });

    await page.getByRole('button', { name: 'In Progress', exact: true }).click();
    await expect(page.getByText('Beta filter')).toBeVisible();
    await expect(page.getByText('Alpha filter')).toHaveCount(0);

    await page.getByRole('button', { name: 'All', exact: true }).click();
    await page.getByPlaceholder('Search tasks...').fill('Alpha');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('Alpha filter')).toBeVisible();
    await expect(page.getByText('Beta filter')).toHaveCount(0);
  });

  test('delete task after confirm', async ({ page }) => {
    await registerViaUi(page);
    await createTaskViaUi(page, { title: 'Delete me soon' });
    await expect(page.getByText('Delete me soon')).toBeVisible();

    page.once('dialog', (dialog) => dialog.accept());
    const [deleted] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/tasks/') && res.request().method() === 'DELETE'
      ),
      page.getByRole('button', { name: 'Delete', exact: true }).click(),
    ]);
    expect(deleted.status()).toBe(200);
    await expect(page.getByText('Delete me soon')).toHaveCount(0);
  });

  test('duplicate email is rejected on register', async ({ page }) => {
    const email = uniqueEmail('dup');
    await registerViaUi(page, { email });
    await page.getByRole('button', { name: 'Logout' }).click();

    await page.goto('/register');
    await page.getByLabel('First Name').fill('Two');
    await page.getByLabel('Last Name').fill('User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(E2E_PASSWORD);

    const [res] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/auth/register') && r.request().method() === 'POST'
      ),
      page.getByRole('button', { name: 'Create account', exact: true }).click(),
    ]);
    expect(res.status()).toBe(409);
    await expect(page).toHaveURL(/register/);
  });
});
