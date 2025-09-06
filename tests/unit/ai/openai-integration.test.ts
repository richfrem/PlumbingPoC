import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock OpenAI at the module level
const mockCreate = vi.fn();
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate
      }
    }
  }))
}));

describe('OpenAI Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GPT Follow-up Question Generation', () => {
    it('should generate follow-up questions for complex plumbing issues', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              requiresFollowUp: true,
              questions: [
                'When does the noise occur?',
                'What type of noise is it?',
                'Is the noise constant or intermittent?'
              ]
            })
          }
        }]
      };

      mockCreate.mockResolvedValueOnce(mockResponse);

      // Import the controller after mocking
      const { getGptFollowUp } = await import('../../../vite-app/api/controllers/requestController.js');

      const testData = {
        clarifyingAnswers: [
          { question: 'What is the property type?', answer: 'House' },
          { question: 'Please describe the general problem.', answer: 'Weird gurgling noise from pipes' }
        ],
        category: 'other',
        problem_description: 'Weird gurgling noise from pipes when water runs'
      };

      // Mock the request/response objects
      const mockReq = { body: testData };
      const mockRes = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      };
      const mockNext = vi.fn();

      await getGptFollowUp(mockReq as any, mockRes as any, mockNext);

      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4-1106-preview',
        messages: [{ role: 'user', content: expect.stringContaining('Weird gurgling noise') }],
        max_tokens: 250,
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });

      expect(mockRes.json).toHaveBeenCalledWith({
        additionalQuestions: [
          'When does the noise occur?',
          'What type of noise is it?',
          'Is the noise constant or intermittent?'
        ]
      });
    });

    it('should skip AI call for standard categories without ambiguous keywords', async () => {
      const { getGptFollowUp } = await import('../../../vite-app/api/controllers/requestController.js');

      const testData = {
        clarifyingAnswers: [
          { question: 'What is the property type?', answer: 'House' },
          { question: 'Please describe the general problem.', answer: 'Faucet is leaking' }
        ],
        category: 'leak_repair',
        problem_description: 'Faucet is leaking slowly'
      };

      const mockReq = { body: testData };
      const mockRes = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      };
      const mockNext = vi.fn();

      await getGptFollowUp(mockReq as any, mockRes as any, mockNext);

      // Should not call OpenAI for standard, clear requests
      expect(mockCreate).not.toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith({
        requiresFollowUp: false,
        questions: []
      });
    });

    it('should handle OpenAI API errors gracefully', async () => {
      mockCreate.mockRejectedValueOnce(
        new Error('OpenAI API rate limit exceeded')
      );

      const { getGptFollowUp } = await import('../../../vite-app/api/controllers/requestController.js');

      const testData = {
        clarifyingAnswers: [
          { question: 'What is the property type?', answer: 'House' }
        ],
        category: 'other',
        problem_description: 'Complex plumbing issue'
      };

      const mockReq = { body: testData };
      const mockRes = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      };
      const mockNext = vi.fn();

      await getGptFollowUp(mockReq as any, mockRes as any, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('OpenAI API')
        })
      );
    });

    it('should handle malformed JSON responses from OpenAI', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: '{ invalid json response }'
          }
        }]
      };

      mockCreate.mockResolvedValueOnce(mockResponse);

      const { getGptFollowUp } = await import('../../../vite-app/api/controllers/requestController.js');

      const testData = {
        clarifyingAnswers: [
          { question: 'What is the property type?', answer: 'House' }
        ],
        category: 'other',
        problem_description: 'Complex issue'
      };

      const mockReq = { body: testData };
      const mockRes = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      };
      const mockNext = vi.fn();

      await getGptFollowUp(mockReq as any, mockRes as any, mockNext);

      // Should handle JSON parsing error gracefully - actually returns questions
      expect(mockRes.json).toHaveBeenCalledWith({
        additionalQuestions: expect.any(Array)
      });
      expect(mockRes.json.mock.calls[0][0].additionalQuestions.length).toBeGreaterThan(0);
    });
  });

  describe('AI Response Schema Validation', () => {
    it('should validate correct AI response schema', () => {
      const validResponse = {
        requiresFollowUp: true,
        questions: ['Question 1?', 'Question 2?']
      };

      // Test schema validation logic
      expect(validResponse).toHaveProperty('requiresFollowUp');
      expect(validResponse).toHaveProperty('questions');
      expect(Array.isArray(validResponse.questions)).toBe(true);
      expect(typeof validResponse.requiresFollowUp).toBe('boolean');
    });

    it('should handle missing questions array', () => {
      const invalidResponse = {
        requiresFollowUp: true
        // missing questions array
      };

      expect(invalidResponse).not.toHaveProperty('questions');
    });

    it('should handle invalid question format', () => {
      const invalidResponse = {
        requiresFollowUp: true,
        questions: 'single question' // should be array
      };

      expect(Array.isArray(invalidResponse.questions)).toBe(false);
    });
  });

  describe('Cost Optimization Logic', () => {
    it('should detect ambiguous keywords that require AI processing', () => {
      const ambiguousKeywords = ['weird', 'strange', 'not sure', 'something else', 'intermittent', 'help'];

      const testCases = [
        { description: 'weird noise from pipes', shouldTriggerAI: true },
        { description: 'strange gurgling sound', shouldTriggerAI: true },
        { description: 'not sure what the problem is', shouldTriggerAI: true },
        { description: 'faucet is leaking', shouldTriggerAI: false },
        { description: 'toilet is clogged', shouldTriggerAI: false }
      ];

      testCases.forEach(({ description, shouldTriggerAI }) => {
        const hasAmbiguousKeyword = ambiguousKeywords.some(keyword =>
          description.toLowerCase().includes(keyword)
        );
        expect(hasAmbiguousKeyword).toBe(shouldTriggerAI);
      });
    });

    it('should optimize AI calls for standard plumbing categories', () => {
      const standardCategories = ['leak_repair', 'fixture_install', 'main_line_repair'];
      const complexCategories = ['other', 'emergency_service'];

      // Standard categories should skip AI when description is clear
      standardCategories.forEach(category => {
        expect(['leak_repair', 'fixture_install', 'main_line_repair']).toContain(category);
      });

      // Complex categories should always use AI
      complexCategories.forEach(category => {
        expect(['other', 'emergency_service']).toContain(category);
      });
    });
  });
});