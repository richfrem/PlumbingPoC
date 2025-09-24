import { Page, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import OpenAI from 'openai';
import { SERVICE_QUOTE_CATEGORIES, GENERIC_QUESTIONS } from '../../../../packages/frontend/src/lib/serviceQuoteQuestions';
import { AttachmentSection } from '../components/AttachmentSection';
import { ServiceLocationManager } from '../components/ServiceLocationManager';

/**
 * Options for creating a quote request
 */
export interface QuoteRequestOptions {
  /** Path to file to attach */
  attachmentPath?: string;
  /** Service location details */
  serviceLocation?: {
    address: string;
    city: string;
    postalCode: string;
  };
}

// Initialize OpenAI client for AI-powered question answering
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


/**
 * Page object for quote request functionality
 */
export class QuoteRequestPage extends BasePage {
  // Selectors
  private requestQuoteButton = '[data-testid="request-quote-button"], button:has-text("Request a Quote"), button:has-text("Request Quote"), a:has-text("Request a Quote"), a:has-text("Request Quote")';
  private submitButton = 'button:has-text("Submit")';
  private modalDialog = '[role="dialog"], .modal, .MuiDialog-root, [data-testid="quote-modal"]';
  private myQuoteRequestsSection = 'text="My Quote Requests"';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Open the quote request modal. This version is strict and reliable.
   */
  async openQuoteRequestModal(): Promise<void> {
    console.log('Attempting to open the quote request modal...');

    const quoteButton = this.page.locator(this.requestQuoteButton).first();

    // 1. Wait for the button to be available before clicking
    await quoteButton.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Found "Request a Quote" button.');

    // 2. Click the button. The `force: true` helps if other elements are in the way.
    console.log('Clicking the "Request a Quote" button...');
    await quoteButton.click({ force: true });

    // Wait for network activity to settle down after the click,
    // in case the modal component is being loaded on demand.
    console.log('Waiting for network activity to be idle...');
    await this.page.waitForLoadState('networkidle');

    // 3. THE CRITICAL FIX:
    // This part is strict. It will wait for the modal to appear and will
    // throw a clear error right here if it doesn't.
    console.log('Waiting for the quote modal to become visible...');
    const modalLocator = this.page.locator(this.modalDialog);

    try {
      // Use a generous timeout because modals can have entry animations.
      await modalLocator.waitFor({ state: 'visible', timeout: 15000 });
      console.log('✅ Modal is visible. Proceeding...');
    } catch (error) {
      console.error('❌ FAILED: Modal did not appear after clicking the "Request a Quote" button.');
      // Take a screenshot at the moment of failure for easy debugging.
      await this.page.screenshot({ path: 'tests/e2e/debug/debug-modal-did-not-open.png', fullPage: true });
      // Re-throw the error with a clear message to fail the test immediately.
      throw new Error(`The quote request modal did not become visible within 15 seconds. Check the screenshot.`);
    }
  }

  /**
   * Select service category by key. This version uses a more robust click method.
   */
  async selectServiceCategory(categoryKey: string): Promise<void> {
    const category = SERVICE_QUOTE_CATEGORIES.find((cat: any) => cat.key === categoryKey);
    if (!category) {
      throw new Error(`Service category with key '${categoryKey}' not found.`);
    }
    console.log(`Selecting service category: ${category.label}`);
    const modalLocator = this.page.locator(this.modalDialog);
    
    // Use getByRole for a more semantic and user-facing selector
    const categoryButton = modalLocator.getByRole('button', { name: category.label, exact: true });
    
    // Wait for the button to be ready and visible
    await categoryButton.waitFor({ state: 'visible', timeout: 10000 });
    
    // Use dispatchEvent to ensure the React event handler fires reliably.
    console.log(`   Dispatching click event on button: "${category.label}" to ensure React handler fires.`);
    await categoryButton.dispatchEvent('click');
    
    // VERIFY THE RESULT: After a successful click, the UI must change.
    // We will wait for the first generic question to appear, confirming the state transition.
    const firstGenericQuestion = GENERIC_QUESTIONS[0].question;
    console.log(`   Waiting for first question to appear: "${firstGenericQuestion.substring(0, 30)}..."`);
    
    const questionBubble = modalLocator.locator('div[class*="MuiBox-root"]').filter({ hasText: firstGenericQuestion }).last();
    await questionBubble.waitFor({ timeout: 15000 });

    console.log('   ✅ Category selection successful. Next question is visible.');
  }
  

  /**
   * Fill out the basic quote request form
   */
  async fillBasicQuoteForm(data: {
    propertyType: 'Residential' | 'Apartment' | 'Commercial' | 'Other';
    isHomeowner: boolean;
    problemDescription: string;
    preferredTiming: string;
    additionalNotes: string;
  }): Promise<void> {
    console.log('Filling out basic quote form...');

    // Property type
    await this.page.getByText('What is the property type?').waitFor();
    await this.page.locator('.MuiSelect-select').first().click();
    await this.page.getByRole('option', { name: data.propertyType }).click();
    await this.page.getByRole('button', { name: 'Send' }).click();

    // Homeowner status
    await this.page.getByText('Are you the homeowner?').waitFor();
    await this.page.locator('div[role="combobox"]').first().waitFor({ timeout: 10000 });
    await this.page.locator('div[role="combobox"]').first().click();
    await this.page.getByRole('option', { name: data.isHomeowner ? 'Yes' : 'No' }).click();
    await this.page.getByRole('button', { name: 'Send' }).click();

    // Problem description
    await this.page.getByText('Please describe the general problem or need.').waitFor();
    await this.page.getByPlaceholder('Type your answer...').fill(data.problemDescription);
    await this.page.getByRole('button', { name: 'Send' }).click();

    // Preferred timing
    await this.page.getByText('What is your preferred timing').waitFor();
    await this.page.getByPlaceholder('Type your answer...').fill(data.preferredTiming);
    await this.page.getByRole('button', { name: 'Send' }).click();

    // Additional notes
    await this.page.getByText('Additional notes').waitFor();
    await this.page.getByPlaceholder('Type your answer...').fill(data.additionalNotes);
    await this.page.getByRole('button', { name: 'Send' }).click();

    console.log('✅ Basic form filled successfully');
  }

  /**
   * Submit the quote request and return the request ID
   */
  async submitQuoteRequest(): Promise<string> {
    console.log('📤 Looking for submit button...');

    // Find the submit button with the exact text "Confirm & Submit Request"
    const submitButtons = this.page.locator('button').filter({ hasText: 'Confirm & Submit Request' });
    const submitButtonCount = await submitButtons.count();
    console.log(`📤 Found ${submitButtonCount} submit buttons`);

    // Start waiting for the API call *before* clicking
    const apiCallPromise = this.page.waitForResponse(response =>
      response.url().includes('/api/requests/submit') && response.status() === 201
    );

    // Find and click the submit button
    if (submitButtonCount === 0) {
      // Try other possible submit button texts
      const altSubmitButtons = this.page.locator('button').filter({ hasText: /^Submit|Send|Complete|Finish$/ });
      const altCount = await altSubmitButtons.count();
      console.log(`📤 Found ${altCount} alternative submit buttons`);

      if (altCount > 0) {
        console.log('📤 Using alternative submit button...');
        await altSubmitButtons.first().waitFor({ timeout: 30000, state: 'visible' });
        console.log('✅ Found alternative submit button, clicking...');
        await altSubmitButtons.first().click({ force: true });
      } else {
        throw new Error('No submit button found');
      }
    } else {
      console.log(`📤 Using first of ${submitButtonCount} submit button(s)...`);
      await submitButtons.first().waitFor({ timeout: 30000, state: 'visible' });
      console.log('✅ Found submit button, clicking...');
      await submitButtons.first().click({ force: true });
    }

    // Wait for the API call to complete successfully
    console.log('Waiting for API submission response...');
    const apiResponse = await apiCallPromise;
    console.log('✅ API submission successful!');

    // Parse the response to get the new request ID
    const responseData = await apiResponse.json();
    const newRequestId = responseData.request?.id;

    if (!newRequestId) {
      throw new Error('Failed to extract request ID from API response.');
    }

    console.log(`✅ Captured new request ID: ${newRequestId}`);

    // Wait for the modal to close to ensure the UI is ready for the next step
    await expect(this.page.locator('[role="dialog"]')).toHaveCount(0, { timeout: 10000 });
    console.log('✅ Modal closed after submission.');

    return newRequestId; // <-- THE CRITICAL FIX
  }

  /**
   * Wait for API submission response
   */
  async waitForSubmissionResponse(): Promise<any> {
    console.log('Waiting for API submission response...');

    const response = await this.waitForApiResponse('/api/requests/submit', 201, 30000);
    const responseData = await response.json();

    console.log('✅ API submission successful!');
    expect(responseData.message).toContain('Quote request submitted successfully');
    expect(responseData.request).toBeDefined();
    expect(responseData.request.id).toBeDefined();

    return responseData;
  }

  /**
   * Verify modal closes after submission
   */
  async verifyModalClosed(): Promise<void> {
    console.log('Verifying modal closes...');

    await this.page.waitForTimeout(2000); // Give time for modal to close
    await expect(this.page.locator(this.modalDialog)).toHaveCount(0);
  }

  /**
   * Verify we're back on the main page
   */
  async verifyOnMainPage(): Promise<void> {
    console.log('Verifying on main page...');

    await expect(this.page.locator(this.myQuoteRequestsSection)).toBeVisible();
  }

  /**
   * Complete quote request workflow (legacy method)
   */
  async createQuoteRequestLegacy(options: {
    isEmergency: boolean;
    category: 'leak_repair' | 'bathroom_renovation';
    formData: {
      propertyType: 'Residential' | 'Apartment' | 'Commercial' | 'Other';
      isHomeowner: boolean;
      problemDescription: string;
      preferredTiming: string;
      additionalNotes: string;
    };
  }): Promise<any> {
    console.log('🚀 Starting quote request creation workflow...');

    // Open modal
    await this.openQuoteRequestModal();

    // Service category
    await this.selectServiceCategory(options.category);

    // Fill form
    await this.fillBasicQuoteForm(options.formData);

    // Submit and wait for API response
    await this.submitQuoteRequest();
    const responseData = await this.waitForSubmissionResponse();

    // Verify completion
    await this.verifyModalClosed();
    await this.verifyOnMainPage();

    console.log('✅ Quote request creation completed successfully!');
    return responseData;
  }

  /**
   * Get the generic questions and answers that apply to all service categories
   */
  private getGenericQuestionsAndAnswers() {
    return GENERIC_QUESTIONS.map((gq: any) => ({
      question: gq.question,
      answer: gq.exampleAnswer
    }));
  }

  /**
   * Get category-specific questions and answers for a given category
   */
  private getCategoryQuestionsAndAnswers(category: any) {
    if (!category.questions || !category.exampleAnswers) {
      return [];
    }

    return category.questions.map((question: string, index: number) => ({
      question,
      answer: category.exampleAnswers[index]
    }));
  }

  /**
   * Function to generate AI-powered answers to AI-generated questions
   */
  private async generateAIAnswer(question: string, category: any, conversationHistory: string[]): Promise<string> {
    try {
      const context = `You are a homeowner filling out a detailed plumbing quote request form.

YOUR PLUMBING REQUEST: "${category.label}"
You want help with a custom plumbing installation for a home brewery setup.

CONVERSATION HISTORY (what you've already told the AI agent):
${conversationHistory.map((item, i) => `${i + 1}. ${item}`).join('\n')}

NOW THE AI AGENT IS ASKING: "${question}"

Your task: Answer this specific question as a homeowner. Give a realistic, detailed answer that makes sense given your previous responses.

IMPORTANT RULES:
- Answer ONLY this question
- Be specific and practical
- Stay in character as a homeowner describing their home/plumbing situation
- Don't mention "licensed plumbers" or give marketing responses
- Keep answer under 50 words

Examples based on your situation:
- If asked about space: "The basement brewery area is 15x12 feet with 8-foot ceilings"
- If asked about equipment: "I have a 10-gallon brewing system that needs dedicated plumbing"
- If asked about materials: "Food-grade stainless steel lines and brass fittings"
- If asked about existing plumbing: "There's a water line and floor drain nearby that can be utilized"`;

      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: context }],
        max_tokens: 60,
        temperature: 0.1, // Very low temperature for focused, consistent answers
      });

      const aiAnswer = response.choices[0]?.message?.content?.trim() || 'Please provide details for this installation.';
      console.log(`🤖 AI Context: Homeowner with brewery setup, previous answers provided`);
      return aiAnswer;
    } catch (error) {
      console.log('OpenAI API error, using fallback answer:', error);
      // Fallback answers based on question type
      if (question.toLowerCase().includes('size') || question.toLowerCase().includes('space')) {
        return 'The installation area is 15 feet by 12 feet with standard ceilings.';
      } else if (question.toLowerCase().includes('equipment')) {
        return 'I have a 10-gallon brewing system that needs dedicated plumbing.';
      } else if (question.toLowerCase().includes('material')) {
        return 'Food-grade stainless steel lines and brass fittings.';
      } else {
        return 'Please provide details for this custom brewery plumbing installation.';
      }
    }
  }

    /**
   * Answers only the initial emergency question and verifies the next state.
   */
  async answerEmergencyQuestion(): Promise<void> {
    const modalLocator = this.page.locator(this.modalDialog);
    console.log('❓ Answering emergency question...');
    try {
      const questionText = 'Is this an emergency?';
      // Wait for the question text to be visible
      await modalLocator.getByText(questionText).waitFor();
      console.log('   ✅ Found emergency question text.');
      
      // Click the "No" button
      const answerButton = modalLocator.getByRole('button', { name: 'No', exact: true });
      await answerButton.click();
      console.log(`   💡 Clicked answer: "No"`);
      
      // IMPORTANT: Wait for the category selection UI to appear. This is the key to fixing the race condition.
      await modalLocator.getByText('Select a service type:').waitFor();
      console.log('   ✅ Category selection UI is now visible.');
    } catch (error) {
      console.error(`❌ FAILED to answer the emergency question.`);
      await this.page.screenshot({ path: `tests/e2e/debug/debug-emergency-question-failure-${Date.now()}.png`, fullPage: true });
      throw error;
    }
  }

  
  /**
   * Answers questions sequentially as they appear in the chat interface.
   * This version is simplified for maximum robustness.
   */
  async answerConversationalQuestions(category: any): Promise<void> {
    const modalLocator = this.page.locator(this.modalDialog);

    const genericQA = this.getGenericQuestionsAndAnswers();
    const categoryQA = this.getCategoryQuestionsAndAnswers(category);
    const allQuestionsToAnswer = [...genericQA, ...categoryQA];

    console.log(`📝 Will answer ${allQuestionsToAnswer.length} questions sequentially.`);

    for (let i = 0; i < allQuestionsToAnswer.length; i++) {
      const qa = allQuestionsToAnswer[i];
      console.log(`❓ [${i + 1}/${allQuestionsToAnswer.length}] Answering: "${qa.question.substring(0, 50)}..."`);

      try {
        // --- THE SIMPLIFIED LOGIC ---
        // 1. Wait for the question to appear anywhere. We look for the LAST instance
        //    to distinguish it from previous questions in the chat history.
        const questionLocator = modalLocator.getByText(qa.question, { exact: false }).last();
        await questionLocator.waitFor({ timeout: 20000 });
        console.log(`   ✅ Question is visible.`);

        // 2. Find the correct interactive element and use it.
        const questionData = GENERIC_QUESTIONS.find(gq => gq.question === qa.question);
        const isButtonChoice = questionData?.choices;

        if (isButtonChoice && qa.answer) {
          const answerButton = modalLocator.getByRole('button', { name: qa.answer, exact: true });
          await answerButton.waitFor({ state: 'visible', timeout: 5000 });
          console.log(`   💡 Clicking button choice: "${qa.answer}"`);
          await answerButton.click();
        } else if (qa.answer) {
          console.log(`   💡 Filling text input with: "${qa.answer}"`);
          const inputField = modalLocator.getByPlaceholder('Type your answer...');
          await inputField.waitFor({ state: 'visible', timeout: 5000 });
          await inputField.fill(qa.answer);
          await modalLocator.getByRole('button', { name: 'Send' }).click();
        }

        // 3. Wait intelligently for the next state.
        if (i < allQuestionsToAnswer.length - 1) {
            const nextQuestion = allQuestionsToAnswer[i + 1];
            console.log(`   ⏳ Waiting for next question: "${nextQuestion.question.substring(0, 30)}..."`);
            // The next question MUST appear after the current one is answered.
            await modalLocator.getByText(nextQuestion.question, { exact: false }).last().waitFor({ timeout: 15000 });
        } else {
            console.log('   ⏳ All questions answered. Waiting for summary screen...');
            await modalLocator.getByText('Please review your request').waitFor({ timeout: 15000 });
        }

      } catch (error) {
        console.error(`❌ FAILED to answer question ${i + 1}: "${qa.question}"`);
        await this.page.screenshot({ path: `tests/e2e/debug/debug-question-${i + 1}-failure-${Date.now()}.png`, fullPage: true });
        throw error;
      }
    }
    console.log('✅ All conversational questions answered');
  }

  /**
   * Answer category-specific questions for a given category
   */
  async answerCategoryQuestions(category: any): Promise<void> {
    const categoryQA = this.getCategoryQuestionsAndAnswers(category);
    const modalLocator = this.page.locator(this.modalDialog);

    for (const qa of categoryQA) {
      console.log(`❓ Answering category question: "${qa.question.substring(0, 50)}..."`);
      console.log(`💡 Answer: "${qa.answer}"`);

      try {
        const questionLocator = modalLocator.getByText(qa.question, { exact: false });
        await questionLocator.waitFor({ timeout: 15000 });

        const answerButton = modalLocator.getByRole('button', { name: qa.answer, exact: true });

        if (qa.answer && await answerButton.isVisible()) {
          console.log('🎯 Clicking button choice...');
          await answerButton.click();
        } else if (qa.answer) {
          console.log('✍️ Filling text input...');
          await modalLocator.getByPlaceholder('Type your answer...').fill(qa.answer);
          await modalLocator.getByRole('button', { name: 'Send' }).click();
        }

        await this.page.waitForTimeout(1500);
      } catch (error) {
        console.error(`❌ FAILED to find or answer category question: "${qa.question}"`);
        await this.page.screenshot({ path: `tests/e2e/debug/debug-category-question-failure-${Date.now()}.png`, fullPage: true });
        throw error;
      }
    }
  }

  /**
   * Handle AI-generated follow-up questions that occur after category questions
   */
  async handleAIFollowUpQuestions(category: any): Promise<void> {
    console.log('🤖 Checking for AI-generated follow-up questions...');
    console.log('📝 AI Agent Phases: 1) Generic → 2) Category-Specific → 3) AI-Generated Clarifying Questions');

    await this.page.waitForTimeout(3000); // Give AI time to process and potentially generate follow-ups

    let followUpQuestionsAnswered = 0;
    // Only attempt follow-ups for the 'other' category as intended
    const maxFollowUpAttempts = category.key === 'other' ? 3 : 0;

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
      const submitButton = this.page.locator('button').filter({ hasText: 'Confirm & Submit Request' });
      if (await submitButton.count() > 0 && await submitButton.isVisible()) {
        console.log('✅ Submit button found - AI conversation complete');
        break;
      }

      // Look for AI-generated follow-up questions
      const inputField = this.page.locator('input[placeholder="Type your answer..."], textarea[placeholder="Type your answer..."]').first();

      if (await inputField.count() > 0 && await inputField.isVisible()) {
        // Found a text input follow-up question (AI-generated)
        console.log(`🤖 Answering AI-generated follow-up question ${followUpQuestionsAnswered + 1} (text input)`);

        // Extract the question text from the page to send to OpenAI
        const questionElements = this.page.locator('p').filter({ hasText: /.+/ });
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

        if (questionText) {
          console.log(`🤖 Agent asked: "${questionText}"`);
          console.log('🧠 Calling OpenAI helper to generate a realistic homeowner answer...');

          // Call the AI helper function to get a dynamic, context-aware answer
          const aiAnswer = await this.generateAIAnswer(questionText, category, conversationHistory);
          console.log(`💡 My (homeowner) answer: "${aiAnswer}"`);

          // Add the current Q&A to conversation history for the next potential follow-up
          conversationHistory.push(`Agent Question: ${questionText}`);
          conversationHistory.push(`My Answer: ${aiAnswer}`);

          await inputField.fill(aiAnswer);
          await this.page.getByRole('button', { name: 'Send' }).click();
          followUpQuestionsAnswered++;
          await this.page.waitForTimeout(3000); // Wait for AI to process
        } else {
          console.warn('⚠️ Could not extract valid AI question text, waiting...');
          await this.page.waitForTimeout(2000);
        }
      } else {
        // Check for Yes/No choice buttons (less common for AI follow-ups)
        // Be more specific to avoid matching buttons outside the modal
        const modalYesButton = this.page.locator('[role="dialog"]').locator('button').filter({ hasText: /^Yes$/ }).first();
        const modalNoButton = this.page.locator('[role="dialog"]').locator('button').filter({ hasText: /^No$/ }).first();

        if (await modalYesButton.count() > 0 && await modalYesButton.isVisible()) {
          console.log(`🤖 Answering AI-generated follow-up question ${followUpQuestionsAnswered + 1} (choosing Yes)`);
          await modalYesButton.click();
          followUpQuestionsAnswered++;
          await this.page.waitForTimeout(2000);
        } else if (await modalNoButton.count() > 0 && await modalNoButton.isVisible()) {
          console.log(`🤖 Answering AI-generated follow-up question ${followUpQuestionsAnswered + 1} (choosing No)`);
          await modalNoButton.click();
          followUpQuestionsAnswered++;
          await this.page.waitForTimeout(2000);
        } else {
          // No questions found, wait a bit
          console.log('⏳ No AI-generated follow-up questions detected, waiting...');
          await this.page.waitForTimeout(2000);
        }
      }
    }

    if (followUpQuestionsAnswered > 0) {
      console.log(`🤖 Successfully answered ${followUpQuestionsAnswered} AI-generated follow-up questions`);
    }
  }

  /**
    * Waits for the summary screen and clicks the final submit button.
    * @returns The ID of the newly created request.
    */
  async confirmAndSubmitRequest(): Promise<string> {
    const modalLocator = this.page.locator(this.modalDialog);

    console.log('⏳ Waiting for the summary screen to appear...');
    const summaryTitle = modalLocator.getByText('Please review your request');
    await summaryTitle.waitFor({ timeout: 20000 }); // Wait for summary to render
    console.log('✅ Summary screen is visible.');

    // Use a data-testid for the submit button for maximum reliability
    const submitButton = modalLocator.getByTestId('submit-quote-request');

    console.log('📤 Clicking the final "Confirm & Submit Request" button...');

    // Start waiting for the API call *before* clicking
    const apiCallPromise = this.page.waitForResponse(response =>
      response.url().includes('/api/requests/submit') && response.status() === 201
    );

    await submitButton.click();

    console.log('⏳ Waiting for API submission response...');
    const apiResponse = await apiCallPromise;
    console.log('✅ API submission successful!');

    const responseData = await apiResponse.json();
    const newRequestId = responseData.request?.id;
    if (!newRequestId) {
      throw new Error('Failed to extract request ID from API response.');
    }
    console.log(`✅ Captured new request ID: ${newRequestId}`);

    // The modal closes itself on success, so we wait for it to disappear
    await modalLocator.waitFor({ state: 'hidden', timeout: 10000 });
    console.log('✅ Modal closed after submission.');

    return newRequestId;
  }


  /**
    * BUILDING BLOCK (COMPOSITE): Creates a new quote request from start to finish.
    * Supports optional file attachments and service location configuration.
    */
  async createQuoteRequest(categoryKey: string, options?: QuoteRequestOptions): Promise<string> {
    const hasAttachment = !!options?.attachmentPath;
    const hasLocation = !!options?.serviceLocation;
    console.log(`🚀 Starting new quote request for category: ${categoryKey}${hasAttachment ? ' (with attachment)' : ''}${hasLocation ? ' (with location)' : ''}...`);

    // 1. Open the modal
    await this.openQuoteRequestModal();

    // 2. Answer the initial emergency question and wait for the next state
    await this.answerEmergencyQuestion();

    // 3. Select the service category (this function now includes its own verification)
    const category = SERVICE_QUOTE_CATEGORIES.find((cat: any) => cat.key === categoryKey);
    if (!category) throw new Error(`Category ${categoryKey} not found.`);
    await this.selectServiceCategory(categoryKey);
    console.log(`✅ Selected category: ${category.label}`);

    // 4. Answer all remaining conversational questions
    await this.answerConversationalQuestions(category);

    // 5. Wait for summary screen
    const modalLocator = this.page.locator(this.modalDialog);
    console.log('⏳ Waiting for the summary screen to appear...');
    const summaryTitle = modalLocator.getByText('Please review your request');
    await summaryTitle.waitFor({ timeout: 20000 });
    console.log('✅ Summary screen is visible.');

    // 6. Conditional branch: Upload attachment if provided (during summary screen)
    if (options?.attachmentPath) {
      console.log('📎 Uploading attachment using reusable AttachmentSection...');
      const attachmentSection = new AttachmentSection(this.page);
      await attachmentSection.uploadFile(options.attachmentPath);
      console.log('✅ Attachment uploaded');

      // TODO: Verify attachment was uploaded (selector needs to be fixed)
      // await this.page.waitForTimeout(1000);
      // const filename = options.attachmentPath.split('/').pop() || '';
      // await attachmentSection.verifyAttachmentExists(filename);
      console.log('✅ Attachment uploaded (verification skipped for now)');
    }

    // 7. Conditional branch: Configure service location if provided
    if (options?.serviceLocation) {
      console.log('📍 Configuring service location using ServiceLocationManager...');
      const locationManager = new ServiceLocationManager(this.page);
      await locationManager.fillAddressForm({
        useProfileAddress: false,
        ...options.serviceLocation
      });
      await locationManager.verifyAddressGeocoding();
      console.log('✅ Service location configured and geocoded');
    }

    // 8. Confirm and submit (one method for all cases)
    const requestId = await this.confirmAndSubmitRequest();

    return requestId;
  }
  
  
}