import OpenAI from 'openai';

// Initialize OpenAI client for AI-powered question answering
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Get the generic questions and answers that apply to all service categories
 */
export function getGenericQuestionsAndAnswers() {
  const { GENERIC_QUESTIONS } = require('../../../packages/frontend/src/lib/serviceQuoteQuestions');
  return GENERIC_QUESTIONS.map((gq: any) => ({
    question: gq.question,
    answer: gq.exampleAnswer
  }));
}

/**
 * Get category-specific questions and answers for a given category
 */
export function getCategoryQuestionsAndAnswers(category: any) {
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
export async function generateAIAnswer(question: string, category: any, conversationHistory: string[]): Promise<string> {
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
export async function answerGenericQuestions(page: any) {
  const genericQA = getGenericQuestionsAndAnswers();

  for (const qa of genericQA) {
    console.log(`❓ Answering generic question: "${qa.question.substring(0, 50)}..."`);
    console.log(`💡 Answer: "${qa.answer}"`);

    // Wait for the question to appear
    await page.locator('p').filter({ hasText: qa.question }).last().waitFor({ timeout: 15000 });

    // Check if this is a button choice or text input
    const allButtons = page.locator('button:not([disabled])').filter({ hasText: /^.{1,50}$/ });
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
      await page.getByPlaceholder('Type your answer...').fill(qa.answer);
      await page.getByRole('button', { name: 'Send' }).click();
    }

    await page.waitForTimeout(1000); // Brief pause
  }
}

/**
 * Answer category-specific questions for a given category
 */
export async function answerCategoryQuestions(page: any, category: any) {
  const categoryQA = getCategoryQuestionsAndAnswers(category);

  for (const qa of categoryQA) {
    console.log(`❓ Answering category question: "${qa.question.substring(0, 50)}..."`);
    console.log(`💡 Answer: "${qa.answer}"`);

    // Wait for the question to appear
    await page.locator('p').filter({ hasText: qa.question }).last().waitFor({ timeout: 15000 });

    // Check if this is a button choice or text input
    const allButtons = page.locator('button:not([disabled])').filter({ hasText: /^.{1,50}$/ });
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
      await page.getByPlaceholder('Type your answer...').fill(qa.answer);
      await page.getByRole('button', { name: 'Send' }).click();
    }

    await page.waitForTimeout(1000); // Brief pause
  }
}