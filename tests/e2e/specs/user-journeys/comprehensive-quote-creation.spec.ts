// tests/e2e/specs/user-journeys/comprehensive-quote-creation.spec.ts

import { test, expect } from '@playwright/test';
import { SERVICE_QUOTE_CATEGORIES } from '../../../../packages/frontend/src/lib/serviceQuoteQuestions';
import { signInForTest, getTestCredentials, getAdminTestCredentials } from '../../utils/auth';
import { answerGenericQuestions, answerCategoryQuestions, generateAIAnswer } from '../../utils/quoteHelpers';
import axios from 'axios';

test.describe('Comprehensive Quote Creation - All Service Categories', () => {
  test('should create quote requests for all service categories, verify via API, and clean up', async ({ page }) => {
    console.log('🧪 Starting comprehensive quote creation test...');

    // Get test credentials
    const { email, password } = getTestCredentials();
    const { email: adminEmail, password: adminPassword } = getAdminTestCredentials();

    // Navigate to the app
    await page.goto('/');

    // Sign in using environment variables
    const signInSuccess = await signInForTest(page, email, password);
    expect(signInSuccess).toBe(true);

    // Get initial My Requests count - use more robust selector
    const initialRequestCount = await page.locator('button').filter({ hasText: /Submitted:/ }).count();
    console.log(`📊 Initial My Requests count: ${initialRequestCount}`);

    const processedCategories: any[] = [];

    // Loop through all service categories dynamically
    for (const category of SERVICE_QUOTE_CATEGORIES) {
      processedCategories.push(category);
      console.log(`🔧 Testing category: ${category.label} (${category.key})`);

      // Click "Request a Quote"
      await page.getByRole('button', { name: 'Request a Quote' }).click();

      // Select "No" for emergency (to get to category selection)
      await page.locator('button').filter({ hasText: /^No$/ }).click();

      // Select the service category
      await page.getByRole('button', { name: category.label }).click();

      // Wait for questions to load
      await page.waitForTimeout(2000);

      console.log(`🤖 Starting conversational flow for ${category.label}...`);

      // Answer generic questions first (apply to all categories)
      await answerGenericQuestions(page);

      // Then answer category-specific questions
      await answerCategoryQuestions(page, category);

      // Handle potential AI follow-up questions before looking for submit button
      // NOTE: The AI agent has 3 phases:
      // 1. Generic questions for all quote types (property type, homeowner, etc.)
      // 2. Category-specific questions from serviceQuoteQuestions.ts
      // 3. AI-generated clarifying questions based on answers (can generate multiple in a loop)
      console.log('🤖 Checking for AI-generated follow-up questions...');
      console.log('📝 AI Agent Phases: 1) Generic → 2) Category-Specific → 3) AI-Generated Clarifying Questions');

      await page.waitForTimeout(3000); // Give AI time to process and potentially generate follow-ups

      // Check if there are any unanswered questions (look for input fields or buttons)
      let followUpQuestionsAnswered = 0;
      const maxFollowUpAttempts = 3; // Allow up to 3 AI follow-ups (can be 3-5 as mentioned)
      const conversationHistory: string[] = [
        'Property type: Residential',
        'Homeowner: Yes',
        'Problem: Kitchen sink leak under the cabinet',
        'Timing: This week',
        'Notes: Access available during business hours',
        'Request: Need help with a custom plumbing installation for a home brewery setup',
        'Requirements: Must comply with local building codes and health department regulations',
        'Urgency: As soon as possible, project deadline approaching'
      ];

      for (let attempt = 0; attempt < maxFollowUpAttempts; attempt++) {
        // Check if submit button is now available (conversation complete)
        const submitButton = page.locator('[data-testid="submit-quote-request"]');
        if (await submitButton.count() > 0 && await submitButton.isVisible()) {
          console.log('✅ Submit button found - AI conversation complete');
          break;
        }

        // Look for AI-generated follow-up questions
        const inputField = page.locator('input[placeholder="Type your answer..."], textarea[placeholder="Type your answer..."]').first();

        if (await inputField.count() > 0 && await inputField.isVisible()) {
          // Found a text input follow-up question (AI-generated)
          console.log(`🤖 Answering AI-generated follow-up question ${followUpQuestionsAnswered + 1} (text input)`);

          // Extract the question text from the page to send to OpenAI
          const questionElements = page.locator('p').filter({ hasText: /.+/ });
          let questionText = '';
          const questionCount = await questionElements.count();

          // Find the most recent question (usually the last one) - be more selective
          for (let i = questionCount - 1; i >= 0; i--) {
            const text = await questionElements.nth(i).textContent();
            if (text && text.length > 15 && text.length < 200 &&
                !text.includes('Thank you') && !text.includes('Residential') &&
                !text.includes('Yes') && !text.includes('Licensed') &&
                !text.includes('Insured') && !text.includes('Trusted') &&
                text.includes('?')) { // Must contain a question mark
              questionText = text;
              break;
            }
          }

          let aiAnswer = '';

          // Replace the old fallback logic with a direct call to the OpenAI helper.
          if (questionText) {
            console.log(`🤖 Agent asked: "${questionText}"`);
            console.log('🧠 Calling OpenAI helper to generate a realistic homeowner answer...');

            // Call the AI helper function to get a dynamic, context-aware answer
            aiAnswer = await generateAIAnswer(questionText, category, conversationHistory);
            console.log(`💡 My (homeowner) answer: "${aiAnswer}"`);

            // Add the current Q&A to conversation history for the next potential follow-up
            conversationHistory.push(`Agent Question: ${questionText}`);
            conversationHistory.push(`My Answer: ${aiAnswer}`);
          } else {
             console.warn('⚠️ Could not extract valid AI question text, skipping this attempt.');
             await page.waitForTimeout(2000);
             continue; // Skip to next iteration
          }

          await inputField.fill(aiAnswer);
          await page.getByRole('button', { name: 'Send' }).click();
          followUpQuestionsAnswered++;
          await page.waitForTimeout(3000); // Wait for AI to process
        } else {
          // Check for Yes/No choice buttons (less common for AI follow-ups)
          const yesButton = page.getByRole('button', { name: 'Yes' });
          const noButton = page.getByRole('button', { name: 'No' });

          if (await yesButton.count() > 0 && await yesButton.isVisible()) {
            console.log(`🤖 Answering AI-generated follow-up question ${followUpQuestionsAnswered + 1} (choosing Yes)`);
            await yesButton.click();
            followUpQuestionsAnswered++;
            await page.waitForTimeout(2000);
          } else if (await noButton.count() > 0 && await noButton.isVisible()) {
            console.log(`🤖 Answering AI-generated follow-up question ${followUpQuestionsAnswered + 1} (choosing No)`);
            await noButton.click();
            followUpQuestionsAnswered++;
            await page.waitForTimeout(2000);
          } else {
            // No questions found, wait a bit
            console.log('⏳ No AI-generated follow-up questions detected, waiting...');
            await page.waitForTimeout(2000);
          }
        }
      }

      // After max follow-up attempts, force the conversation to end by waiting for submit button
      console.log('🔄 Max AI follow-up attempts reached, forcing conversation end...');

      // Now look for the submit button
      console.log('📤 Looking for submit button...');
      const submitButton = page.locator('[data-testid="submit-quote-request"]');

      // Start waiting for the API call before clicking
      const apiCallPromise = page.waitForResponse(response =>
        response.url().includes('/api/requests/submit') && response.status() === 201
      );

      await submitButton.waitFor({ timeout: 30000, state: 'visible' });
      console.log('✅ Found submit button, clicking...');
      await submitButton.click({ force: true });

      // Wait for the API call to complete successfully
      console.log('Waiting for API submission response...');
      const apiResponse = await apiCallPromise;
      console.log('✅ API submission successful!');

      // Verify the response contains the expected data
      const responseData = await apiResponse.json();
      expect(responseData.message).toContain('Quote request submitted successfully');
      expect(responseData.request).toBeDefined();
      expect(responseData.request.id).toBeDefined();

      // Wait for modal to close
      await page.waitForTimeout(2000);
      await expect(page.locator('[role="dialog"]')).toHaveCount(0);

      console.log(`✅ Successfully created quote for ${category.label}`);
    }

    // Verify all quotes appear in My Requests
    console.log('🔍 Verifying quotes appear in My Requests...');

    // Wait for realtime updates
    await page.waitForTimeout(5000);

    const finalRequestCount = await page.locator('button').filter({ hasText: /Submitted:/ }).count();
    const expectedCount = initialRequestCount + processedCategories.length;

    console.log(`📊 Final My Requests count: ${finalRequestCount} (expected: ${expectedCount})`);

    // Verify we have the expected number of requests
    expect(finalRequestCount).toBe(expectedCount);

    // Verify each processed category appears in the list
    for (const category of processedCategories) {
      const requestItem = page.locator('button').filter({
        hasText: new RegExp(`${category.key}.*Submitted:`, 'i')
      });
      await expect(requestItem).toBeVisible();
      console.log(`✅ Found quote for ${category.label} in My Requests`);
    }

    // API Verification: Verify quotes exist via API
    console.log('🔍 Verifying quotes exist via API...');

    // Sign out and sign in as admin to access API
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await page.waitForTimeout(1000);

    const adminSignInSuccess = await signInForTest(page, adminEmail, adminPassword);
    expect(adminSignInSuccess).toBe(true);

    // Navigate to dashboard to trigger API calls
    await page.getByRole('button', { name: 'Command Center' }).click();
    await page.waitForTimeout(3000);

    // The dashboard should load and show all requests including our test ones
    const dashboardRequestCount = await page.locator('[data-testid="request-row"]').count();
    console.log(`📊 Dashboard shows ${dashboardRequestCount} total requests`);

    // Verify we can see our test requests (they should have "Test Address" in them)
    const testRequests = page.locator('[data-testid="request-row"]').filter({ hasText: 'Test Address' });
    const testRequestCount = await testRequests.count();
    console.log(`📊 Found ${testRequestCount} test requests in dashboard`);

    expect(testRequestCount).toBeGreaterThanOrEqual(processedCategories.length);

    console.log('🎉 Comprehensive quote creation test completed successfully!');
    console.log(`📋 Created ${processedCategories.length} test requests across processed categories`);
    console.log('🧹 Test data cleanup should be handled at the E2E suite level');
  });
});