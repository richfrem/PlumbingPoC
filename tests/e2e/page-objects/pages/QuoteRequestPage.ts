import { Page, expect } from '@playwright/test';
import { BasePage } from '../base/BasePage';
import OpenAI from 'openai';
import { SERVICE_QUOTE_CATEGORIES } from '../../../packages/frontend/src/lib/serviceQuoteQuestions';

// Initialize OpenAI client for AI-powered question answering
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


/**
 * Page object for quote request functionality
 */
export class QuoteRequestPage extends BasePage {
  // Selectors
  private requestQuoteButton = 'button:has-text("Request a Quote")';
  private emergencyYesButton = 'button:has-text("Yes, it\'s an emergency")';
  private emergencyNoButton = 'button:has-text("No")';
  private serviceCategoryButtons = {
    leakRepair: 'button:has-text("Leak Repair")',
    bathroomRenovation: 'button:has-text("Bathroom Renovation")'
  };
  private submitButton = 'button:has-text("Submit")';
  private modalDialog = '[role="dialog"]';
  private myQuoteRequestsSection = 'text="My Quote Requests"';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Open the quote request modal
   */
  async openQuoteRequestModal(): Promise<void> {
    console.log('Opening quote request modal...');
    await this.page.locator(this.requestQuoteButton).click();
    await this.waitForElement(this.modalDialog);
  }

  /**
   * Handle emergency triage
   */
  async selectEmergencyOption(isEmergency: boolean): Promise<void> {
    const buttonText = isEmergency ? 'Yes, it\'s an emergency' : 'No';
    console.log(`Selecting emergency option: ${buttonText}`);

    await this.page.locator(`button:has-text("${buttonText}")`).click();
  }

  /**
   * Select service category
   */
  async selectServiceCategory(category: 'leak_repair' | 'bathroom_renovation'): Promise<void> {
    const categoryMap = {
      leak_repair: 'Leak Repair',
      bathroom_renovation: 'Bathroom Renovation'
    };

    const categoryText = categoryMap[category];
    console.log(`Selecting service category: ${categoryText}`);

    await this.page.locator(`button:has-text("${categoryText}")`).click();
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

    // Emergency triage
    await this.selectEmergencyOption(options.isEmergency);

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
    const { GENERIC_QUESTIONS } = require('../../../../packages/frontend/src/lib/serviceQuoteQuestions');
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
   * Answer the generic questions that apply to all services
   */
  async answerGenericQuestions(): Promise<void> {
    const genericQA = this.getGenericQuestionsAndAnswers();

    for (const qa of genericQA) {
      console.log(`❓ Answering generic question: "${qa.question.substring(0, 50)}..."`);
      console.log(`💡 Answer: "${qa.answer}"`);

      // Wait for the question to appear
      await this.page.locator('p').filter({ hasText: qa.question }).last().waitFor({ timeout: 15000 });

      // Check if this is a button choice or text input
      const allButtons = this.page.locator('button:not([disabled])').filter({ hasText: /^.{1,50}$/ });
      const buttonCount = await allButtons.count();

      let foundMatchingButton = false;
      if (buttonCount > 0) {
        console.log(`🔍 Looking for button with text: "${qa.answer}" among ${buttonCount} buttons`);
        for (let i = 0; i < buttonCount; i++) {
          const button = allButtons.nth(i);
          const buttonText = await button.textContent();
          console.log(`🔍 Button ${i}: "${buttonText}"`);
          if (buttonText && buttonText.trim() === qa.answer?.trim()) {
            console.log('🎯 Clicking button choice...');
            await button.click();
            foundMatchingButton = true;
            break;
          }
        }
      }

      if (!foundMatchingButton && qa.answer) {
        console.log('✍️ Filling text input...');
        await this.page.getByPlaceholder('Type your answer...').fill(qa.answer);
        await this.page.getByRole('button', { name: 'Send' }).click();
      }

      await this.page.waitForTimeout(1000); // Brief pause
    }
  }

  /**
   * Answer category-specific questions for a given category
   */
  async answerCategoryQuestions(category: any): Promise<void> {
    const categoryQA = this.getCategoryQuestionsAndAnswers(category);

    for (const qa of categoryQA) {
      console.log(`❓ Answering category question: "${qa.question.substring(0, 50)}..."`);
      console.log(`💡 Answer: "${qa.answer}"`);

      // Wait for the question to appear
      await this.page.locator('p').filter({ hasText: qa.question }).last().waitFor({ timeout: 15000 });

      // Check if this is a button choice or text input
      const allButtons = this.page.locator('button:not([disabled])').filter({ hasText: /^.{1,50}$/ });
      const buttonCount = await allButtons.count();

      let foundMatchingButton = false;
      if (buttonCount > 0) {
        for (let i = 0; i < buttonCount; i++) {
          const button = allButtons.nth(i);
          const buttonText = await button.textContent();
          if (buttonText && buttonText.trim() === qa.answer?.trim()) {
            console.log('🎯 Clicking button choice...');
            await button.click();
            foundMatchingButton = true;
            break;
          }
        }
      }

      if (!foundMatchingButton && qa.answer) {
        console.log('✍️ Filling text input...');
        await this.page.getByPlaceholder('Type your answer...').fill(qa.answer);
        await this.page.getByRole('button', { name: 'Send' }).click();
      }

      await this.page.waitForTimeout(1000); // Brief pause
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
   * BUILDING BLOCK (COMPOSITE): Creates a new quote request from start to finish.
   * Assembles other building blocks to perform a complete user action.
   * @param categoryKey The key of the service category (e.g., 'perimeter_drains').
   * @returns The ID of the newly created request.
   */
  async createQuoteRequest(categoryKey: string): Promise<string> {
    console.log(`Creating a new quote request for category: ${categoryKey}...`);

    await this.page.getByRole('button', { name: 'Request a Quote' }).click();
    await this.page.locator('button').filter({ hasText: /^No$/ }).click();

    // Use the imported SERVICE_QUOTE_CATEGORIES
    const category = SERVICE_QUOTE_CATEGORIES.find((cat: any) => cat.key === categoryKey);
    expect(category).toBeDefined();
    await this.page.locator('button').filter({ hasText: category!.label }).first().click();

    await this.page.waitForTimeout(2000); // Wait for chat to initialize
    await this.answerGenericQuestions();
    await this.answerCategoryQuestions(category!);
    await this.handleAIFollowUpQuestions(category!);

    const requestId = await this.submitQuoteRequest();
    console.log(`✅ Quote request created with ID: ${requestId}`);
    return requestId;
  }
}