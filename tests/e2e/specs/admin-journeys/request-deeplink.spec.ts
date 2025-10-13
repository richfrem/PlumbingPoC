import { test, expect } from '@playwright/test';
import { AuthPage } from '../../page-objects/pages/AuthPage';
// Create requests directly via API to keep this test focused and avoid heavy page-object imports

test.describe('Admin deep-link -> dashboard modal', () => {
  test('email deep-link opens request modal on dashboard', async ({ page }) => {
    const authPage = new AuthPage(page);

    // 1) Create a request directly via the API (no frontend interactions) to act as the emailed resource
    const apiBase = process.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5173';
    const createBody = {
      clarifyingAnswers: [ { question: 'What is the property type?', answer: 'House' } ],
      contactInfo: { name: 'E2E Test', email: 'e2e@example.com' },
      category: 'leak_repair',
      isEmergency: false,
      property_type: 'House',
      is_homeowner: 'Yes',
      problem_description: 'E2E test leak',
      preferred_timing: 'ASAP'
    };

    // Authenticate via Supabase to get a Bearer token for creating the request
    let authToken: string | null = null;
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL || '', process.env.SUPABASE_ANON_KEY || '');
      const creds = { email: process.env.TEST_USER_EMAIL || '', password: process.env.TEST_USER_PASSWORD || '' };
      if (creds.email && creds.password) {
        const { data, error } = await supabase.auth.signInWithPassword(creds as any);
        if (error) {
          console.warn('Supabase signInWithPassword failed:', error.message);
        } else {
          authToken = data?.session?.access_token || null;
        }
      }
    } catch (err) {
      console.warn('Supabase auth setup failed in test:', err);
    }

    const headers: any = { 'Content-Type': 'application/json' };
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const createResp = await page.request.post(`${apiBase}/api/requests/submit`, { data: createBody, headers });
    if (!createResp.ok()) {
      const text = await createResp.text();
      console.error('Create request failed:', createResp.status, text);
    }
    expect(createResp.ok()).toBeTruthy();
    const createJson = await createResp.json();
    const requestId = createJson.request?.id;
    expect(requestId).toBeTruthy();

    // 2) Sign in as admin (the dashboard user)
    await authPage.signInAsUserType('admin');

    // Ensure dashboard base content is present
    await expect(page.getByText("Plumber's Command Center")).toBeVisible({ timeout: 10000 });

    // 3) Simulate clicking an email deep-link by injecting an anchor and clicking it
    await page.evaluate((id) => {
      const a = document.createElement('a');
      a.href = `/#/requests/${id}`;
      a.id = 'test-deeplink-anchor';
      a.text = 'Open Request Deep Link';
      // Make sure the anchor is visible/clickable
      a.style.position = 'fixed';
      a.style.left = '10px';
      a.style.top = '10px';
      a.style.zIndex = '9999';
      document.body.appendChild(a);
      // Click the link
      (a as HTMLAnchorElement).click();
    }, requestId);

    // 4) Assert the modal overlay opens (RequestDetailModal uses header titled 'Job Docket:')
    await expect(page.getByText(/^Job Docket:/)).toBeVisible({ timeout: 10000 });

    // Assert dashboard still visible underneath
    await expect(page.getByText("Plumber's Command Center")).toBeVisible();

    // 5) Close the modal by navigating back to dashboard and assert it disappears
    await page.evaluate(() => { window.location.hash = '#/dashboard'; });
    await expect(page.getByText(/^Job Docket:/)).toHaveCount(0, { timeout: 5000 });
  });
});
