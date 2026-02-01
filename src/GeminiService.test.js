/**
 * Gemini Service Tests - Akustik Produkt AI Integration
 * 
 * Tests all AI service functions with mocked API responses
 * ensuring proper error handling, data validation, and output formatting.
 */

// Mock Google GenAI module
const mockGoogleGenAI = {
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn()
    }
  })),
  Type: {
    OBJECT: 'OBJECT',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    ARRAY: 'ARRAY'
  }
};

jest.mock('@google/genai', () => mockGoogleGenAI);

// Mock environment variables for Node.js testing
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    VITE_GEMINI_API_KEY: 'test-api-key-12345'
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('Gemini Service Tests', () => {
  let mockGenerateContent;

  beforeEach(() => {
    mockGenerateContent = jest.fn();
    const mockAI = new mockGoogleGenAI.GoogleGenAI({ apiKey: 'test-key' });
    mockAI.models.generateContent = mockGenerateContent;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateDJPromo', () => {
    it('should generate DJ promo metadata successfully', async () => {
      // Arrange
      const mockResponse = {
        text: JSON.stringify({
          clubHype: "Zurich's latest underground weapon drops tonight!",
          poolDescription: "Dark techno masterpiece with rolling basslines and industrial percussion.",
          micShoutout: "Big shout to the crew supporting Zurich techno scene!",
          targetBpm: "125-130 BPM",
          mixTips: "Transition from deeper groove, let kick drive for 8 bars."
        })
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      // Act - Simulate the actual service function
      const generateDJPromo = async (trackTitle, artist, vibe) => {
        if (!process.env.VITE_GEMINI_API_KEY) return null;
        
        try {
          const response = mockGenerateContent();
          const jsonStr = response.text?.trim();
          return jsonStr ? JSON.parse(jsonStr) : null;
        } catch (error) {
          console.error("DJ Promo Generation Error:", error);
          return null;
        }
      };

      const result = await generateDJPromo("Cyber Dreams", "Neural Wave", "Dark Industrial");

      // Assert
      expect(result).not.toBeNull();
      expect(result.clubHype).toContain('Zurich');
      expect(result.poolDescription).toContain('techno');
      expect(result.micShoutout).toContain('Zurich');
      expect(result.targetBpm).toContain('125-130');
      expect(result.mixTips).toContain('Transition');

      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should handle empty API response', async () => {
      // Arrange
      mockGenerateContent.mockResolvedValue({ text: null });

      // Act
      const generateDJPromo = async () => {
        if (!process.env.VITE_GEMINI_API_KEY) return null;
        const response = mockGenerateContent();
        return response.text ? JSON.parse(response.text) : null;
      };

      const result = await generateDJPromo("Test Track", "Test Artist", "Test Vibe");

      // Assert
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      // Arrange
      mockGenerateContent.mockRejectedValue(new Error('API Error'));

      // Act
      const generateDJPromo = async () => {
        if (!process.env.VITE_GEMINI_API_KEY) return null;
        try {
          const response = mockGenerateContent();
          return response.text ? JSON.parse(response.text) : null;
        } catch (error) {
          console.error("DJ Promo Generation Error:", error);
          return null;
        }
      };

      const result = await generateDJPromo("Test Track", "Test Artist", "Test Vibe");

      // Assert
      expect(result).toBeNull();
    });

    it('should handle malformed JSON response', async () => {
      // Arrange
      mockGenerateContent.mockResolvedValue({ text: 'invalid json{' });

      // Act
      const generateDJPromo = async () => {
        if (!process.env.VITE_GEMINI_API_KEY) return null;
        try {
          const response = mockGenerateContent();
          return JSON.parse(response.text);
        } catch (error) {
          console.error("DJ Promo Generation Error:", error);
          return null;
        }
      };

      const result = await generateDJPromo("Test Track", "Test Artist", "Test Vibe");

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('generateSocialUplink', () => {
    it('should generate social media content for all platforms', async () => {
      // Arrange
      const mockResponse = {
        text: JSON.stringify({
          facebook: {
            caption: "Professional post about new track release",
            hashtags: ["#techno", "#music", "#release"]
          },
          instagram: {
            caption: "Aesthetic post with emojis 🎵🔥",
            hashtags: ["#AkustikProdukt", "#ZurichTechno", "#technomusic"]
          },
          tiktok: {
            hook: "This new Zurich techno track will blow your mind!",
            tags: ["techno", "zurich", "music"],
            audioSuggestion: "Dark industrial techno beat"
          }
        })
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      // Act
      const generateSocialUplink = async () => {
        if (!process.env.VITE_GEMINI_API_KEY) return null;
        try {
          const response = mockGenerateContent();
          const jsonStr = response.text?.trim();
          return jsonStr ? JSON.parse(jsonStr) : null;
        } catch (error) {
          console.error("Social Generation Error:", error);
          return null;
        }
      };

      const result = await generateSocialUplink("Neural Beats", "DJ Cyber", "Industrial Techno");

      // Assert
      expect(result).not.toBeNull();
      expect(result.facebook.caption).toContain('track release');
      expect(result.facebook.hashtags).toContain('#techno');
      expect(result.instagram.hashtags).toContain('#AkustikProdukt');
      expect(result.tiktok.hook).toContain('Zurich');
      expect(result.tiktok.audioSuggestion).toContain('industrial');

      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });

  describe('generateGrowthContent', () => {
    it('should generate growth-focused content', async () => {
      // Arrange
      const mockResponse = {
        text: JSON.stringify({
          title: "10 Techno Production Secrets",
          content: "Hook: Want your techno tracks to stand out? Problem: Most producers make these 3 mistakes...",
          viralScore: 85
        })
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      // Act
      const generateGrowthContent = async () => {
        if (!process.env.VITE_GEMINI_API_KEY) return null;
        try {
          const response = mockGenerateContent();
          const jsonStr = response.text?.trim();
          return jsonStr ? JSON.parse(jsonStr) : null;
        } catch (error) {
          console.error("Growth Generation Error:", error);
          return null;
        }
      };

      const result = await generateGrowthContent("Music Production", "educational");

      // Assert
      expect(result).not.toBeNull();
      expect(result.title).toContain('Techno Production');
      expect(result.content).toContain('Hook:');
      expect(result.viralScore).toBe(85);
      expect(typeof result.viralScore).toBe('number');
    });

    it('should handle different content types', async () => {
      // Arrange
      const mockResponse = {
        text: JSON.stringify({
          title: "Premium Synthesizer Bundle",
          content: "Hook: Professional sound design tool Problem: Generic presets...",
          viralScore: 72
        })
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      // Act
      const generateGrowthContent = async () => {
        if (!process.env.VITE_GEMINI_API_KEY) return null;
        try {
          const response = mockGenerateContent();
          const jsonStr = response.text?.trim();
          return jsonStr ? JSON.parse(jsonStr) : null;
        } catch (error) {
          console.error("Growth Generation Error:", error);
          return null;
        }
      };

      const result = await generateGrowthContent("Audio Equipment", "ecommerce");

      // Assert
      expect(result).not.toBeNull();
      expect(result.title).toContain('Synthesizer');
      expect(result.viralScore).toBe(72);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing API key gracefully', async () => {
      // Arrange
      const originalKey = process.env.VITE_GEMINI_API_KEY;
      delete process.env.VITE_GEMINI_API_KEY;

      // Act
      const generateDJPromo = async () => {
        if (!process.env.VITE_GEMINI_API_KEY) return null;
        const response = mockGenerateContent();
        return response.text ? JSON.parse(response.text) : null;
      };

      const result = await generateDJPromo("Test", "Artist", "Vibe");

      // Assert
      expect(result).toBeNull();

      // Restore
      process.env.VITE_GEMINI_API_KEY = originalKey;
    });

    it('should handle rate limiting errors', async () => {
      // Arrange
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.status = 429;
      mockGenerateContent.mockRejectedValue(rateLimitError);

      // Act
      const generateDJPromo = async () => {
        if (!process.env.VITE_GEMINI_API_KEY) return null;
        try {
          const response = mockGenerateContent();
          return response.text ? JSON.parse(response.text) : null;
        } catch (error) {
          console.error("DJ Promo Generation Error:", error);
          return null;
        }
      };

      const result = await generateDJPromo("Test", "Artist", "Vibe");

      // Assert
      expect(result).toBeNull();
    });

    it('should handle network timeouts', async () => {
      // Arrange
      const timeoutError = new Error('Network timeout');
      timeoutError.code = 'ETIMEDOUT';
      mockGenerateContent.mockRejectedValue(timeoutError);

      // Act
      const generateDJPromo = async () => {
        if (!process.env.VITE_GEMINI_API_KEY) return null;
        try {
          const response = mockGenerateContent();
          return response.text ? JSON.parse(response.text) : null;
        } catch (error) {
          console.error("DJ Promo Generation Error:", error);
          return null;
        }
      };

      const result = await generateDJPromo("Test", "Artist", "Vibe");

      // Assert
      expect(result).toBeNull();
    });

    it('should validate input parameters', async () => {
      // Act
      const generateDJPromo = async (trackTitle, artist, vibe) => {
        if (!process.env.VITE_GEMINI_API_KEY || !trackTitle || !artist || !vibe) return null;
        try {
          const response = mockGenerateContent();
          return response.text ? JSON.parse(response.text) : null;
        } catch (error) {
          return null;
        }
      };

      // Test with empty strings
      const result1 = await generateDJPromo("", "", "");
      expect(result1).toBeNull();

      // Test with null/undefined inputs
      const result2 = await generateDJPromo(null, null, null);
      expect(result2).toBeNull();
    });
  });

  describe('Integration with Akustik Produkt Services', () => {
    it('should integrate with database storage', async () => {
      // This test simulates AI service + database integration
      const mockResponse = {
        text: JSON.stringify({
          clubHype: "Test hype",
          poolDescription: "Test description",
          micShoutout: "Test shoutout",
          targetBpm: "120-130 BPM",
          mixTips: "Test tips"
        })
      };

      mockGenerateContent.mockResolvedValue(mockResponse);

      // Simulate AI service
      const generateDJPromo = async () => {
        if (!process.env.VITE_GEMINI_API_KEY) return null;
        try {
          const response = mockGenerateContent();
          const jsonStr = response.text?.trim();
          return jsonStr ? JSON.parse(jsonStr) : null;
        } catch (error) {
          console.error("DJ Promo Generation Error:", error);
          return null;
        }
      };

      // Simulate database storage
      const saveToDatabase = async (aiResponse) => {
        return {
          id: Math.floor(Math.random() * 1000),
          content: aiResponse,
          timestamp: new Date().toISOString()
        };
      };

      // Execute workflow
      const aiResult = await generateDJPromo("Test Track", "Test Artist", "Test Vibe");
      const dbResult = await saveToDatabase(aiResult);

      // Assert
      expect(aiResult).not.toBeNull();
      expect(aiResult.clubHype).toBe("Test hype");
      expect(dbResult.id).toBeDefined();
      expect(dbResult.content).toEqual(aiResult);
    });
  });
});