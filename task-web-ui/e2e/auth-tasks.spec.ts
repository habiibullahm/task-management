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

  test('forgot and reset password flow', async ({ page, request }) => {
    const { email } = await registerViaUi(page);
    await page.getByRole('button', { name: 'Logout' }).click();

    const forgotApi = await request.post(`${process.env.PLAYWRIGHT_API_URL || 'http://127.0.0.1:3001'}/api/v1/auth/forgot-password`, {
      data: { email },
    });
    expect(forgotApi.ok()).toBeTruthy();
    const forgotBody = await forgotApi.json();
    const resetToken = forgotBody.data?.resetToken as string;
    expect(resetToken).toBeTruthy();

    const newPassword = 'E2EResetPass123!@#';
    await page.goto(`/reset-password?token=${encodeURIComponent(resetToken)}`);
    await page.getByLabel('New password').fill(newPassword);
    await page.getByLabel('Confirm password').fill(newPassword);
    await page.getByRole('button', { name: 'Reset password', exact: true }).click();
    await expect(page).toHaveURL(/login/);

    const loginRes = await loginViaUi(page, email, newPassword);
    expect(loginRes.status()).toBe(200);
    await expect(page).toHaveURL(/dashboard/);
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
    await createTaskViaUi(page, { title: 'Stat todo', status: 'TODO' });
    await createTaskViaUi(page, { title: 'Stat progress', status: 'IN_PROGRESS' });
    await createTaskViaUi(page, { title: 'Stat review', status: 'IN_REVIEW' });

    await page.goto('/dashboard');
    await expect(page.getByText(/welcome back, dash/i)).toBeVisible();
    await expect(page.getByText('Total Tasks')).toBeVisible();
    await expect(page.getByText('To Do', { exact: true })).toBeVisible();
    await expect(page.getByText('In Progress', { exact: true })).toBeVisible();
    await expect(page.getByText('In Review', { exact: true })).toBeVisible();
    await expect(page.getByText('Completed', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Task' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'My Tasks' })).toBeVisible();

    const statValues = page.locator('p.text-4xl.font-bold');
    // Total + one card per TaskStatus (TODO, IN_PROGRESS, IN_REVIEW, DONE, CANCELLED)
    await expect(statValues).toHaveCount(6);
    await expect(statValues.first()).toHaveText('3', { timeout: 10_000 });

    const statusCounts = await Promise.all(
      [1, 2, 3, 4, 5].map(async (i) => Number(await statValues.nth(i).innerText())),
    );
    expect(statusCounts.reduce((sum, n) => sum + n, 0)).toBe(3);
    expect(statusCounts[0]).toBe(1); // To Do
    expect(statusCounts[1]).toBe(1); // In Progress
    expect(statusCounts[2]).toBe(1); // In Review

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
    await expect(
      page.locator('div').filter({ hasText: 'E2E live task' }).getByText('High', { exact: true })
    ).toBeVisible();
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
    await expect(
      page.locator('div').filter({ hasText: 'Edited task title' }).getByText('Low', { exact: true })
    ).toBeVisible();
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

    await page.getByRole('button', { name: 'All statuses', exact: true }).click();
    await page.getByPlaceholder('Search tasks...').fill('Alpha');
    await expect(page.getByText('Alpha filter')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Beta filter')).toHaveCount(0);
    await expect(page).toHaveURL(/search=Alpha/, { timeout: 10_000 });
  });

  test('priority filter and no-match empty state', async ({ page }) => {
    await registerViaUi(page);
    await createTaskViaUi(page, { title: 'Low priority only', priority: 'LOW' });

    await page.getByRole('group', { name: 'Filter by priority' }).getByRole('button', { name: 'Urgent', exact: true }).click();
    await expect(page.getByText('No tasks match')).toBeVisible();
    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    await expect(page.getByText('Low priority only')).toBeVisible();
  });

  test('cancelled chip and sort alone keep no-tasks-yet empty state', async ({ page }) => {
    await registerViaUi(page);
    await page.getByRole('button', { name: 'My Tasks', exact: true }).click();
    await expect(page).toHaveURL(/\/tasks/);

    await expect(page.getByRole('group', { name: 'Filter by status' }).getByRole('button', { name: 'Cancelled', exact: true })).toBeVisible();
    await expect(page.getByText('No tasks yet')).toBeVisible();

    await page.getByRole('button', { name: 'Due date', exact: true }).click();
    await expect(page).toHaveURL(/sort=dueDate/);
    await expect(page.getByText('No tasks yet')).toBeVisible();
    await expect(page.getByText('No tasks match')).toHaveCount(0);

    await page.getByRole('button', { name: 'Recently updated', exact: true }).click();
    await expect(page).not.toHaveURL(/sort=/);
    await expect(page.getByText('No tasks yet')).toBeVisible();
  });

  test('dashboard status card deep-links to filtered task list', async ({ page }) => {
    await registerViaUi(page);
    await createTaskViaUi(page, { title: 'Dashboard todo', status: 'TODO' });
    await page.goto('/dashboard');
    await expect(page.getByText(/welcome back/i)).toBeVisible();

    await page.getByRole('link', { name: 'View To Do tasks', exact: true }).click();
    await expect(page).toHaveURL(/status=TODO/);
    await expect(page.getByText('Dashboard todo')).toBeVisible();

    await page.goto('/dashboard');
    await page.getByRole('link', { name: 'View all tasks', exact: true }).click();
    await expect(page).toHaveURL(/\/tasks\/?$/);
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
