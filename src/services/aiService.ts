interface NewsletterAnalysis {
  title: string;
  sender: string;
  isNewsletter: boolean;
  confidence: number;
  topics: string[];
}

interface SummaryRequest {
  newsletters: Array<{
    title: string;
    content: string;
    sender: string;
    date: string;
  }>;
}

class AIService {
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_API_KEY || '';
  }

  async analyzeNewsletter(emailContent: string, subject: string, sender: string): Promise<NewsletterAnalysis> {
    const prompt = `
Analyze this email to determine if it's a newsletter and extract key information.

Email Subject: ${subject}
Email Sender: ${sender}
Email Content (first 1000 chars): ${emailContent.substring(0, 1000)}

Please respond with a JSON object containing:
{
  "title": "Clean newsletter title (or subject if not newsletter)",
  "sender": "Sender name or organization",
  "isNewsletter": true/false,
  "confidence": 0.0-1.0,
  "topics": ["topic1", "topic2", "topic3"]
}

Consider these factors for newsletter identification:
- Contains unsubscribe links
- Regular publication pattern
- Formatted content with sections
- Marketing/informational content
- Sender appears to be organization/publication

Topics should be broad categories like: Technology, Business, Marketing, Design, Finance, Health, Science, etc.
`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500,
            }
          })
        }
      );

      console.log("response : ", response);

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates[0]?.content?.parts[0]?.text || '';
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback if JSON parsing fails
      return {
        title: subject,
        sender: sender,
        isNewsletter: false,
        confidence: 0.1,
        topics: []
      };
    } catch (error) {
      console.error('Error analyzing newsletter:', error);
      return {
        title: subject,
        sender: sender,
        isNewsletter: false,
        confidence: 0.1,
        topics: []
      };
    }
  }

  async generateSummary(newsletters: SummaryRequest['newsletters']): Promise<string> {
    if (newsletters.length === 0) {
      return "No newsletters to summarize.";
    }

    const newsletterContent = newsletters.map(n => 
      `**${n.title}** (from ${n.sender}, ${n.date})\n${n.content.substring(0, 2000)}...\n\n`
    ).join('');

    const prompt = `
Create a comprehensive summary of these newsletters in markdown format. Focus on the most important insights, trends, and actionable information.

Newsletter Content:
${newsletterContent}

Please create a well-structured summary with:
1. A brief overview of the main themes
2. Key insights organized by topic
3. Important trends or developments
4. Notable quotes or statistics
5. Actionable takeaways

Format the response in clean markdown with appropriate headers, bullet points, and emphasis. Keep it concise but informative, around 500-800 words.
`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2000,
            }
          })
        }
      );

      if (!response.ok) {
        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0]?.content?.parts[0]?.text || 'Unable to generate summary.';
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Error generating summary. Please try again later.';
    }
  }
}

export const aiService = new AIService();