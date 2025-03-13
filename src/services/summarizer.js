const { OpenAI } = require('openai');

class Summarizer {
  constructor() {
    this.groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    });
  }

  async generateSummary(messages) {
    try {
      // Prepare messages for summarization
      const messageText = messages
        .map(msg => msg.text)
        .join('\n');

      // Generate summary using Groq
      const groqResponse = await this.groq.chat.completions.create({
        model: 'llama3-8b-8192',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that summarizes Slack messages into clear, concise bullet points. Focus on key information, decisions, and action items.'
          },
          {
            role: 'user',
            content: `Please summarize these Slack messages into bullet points, categorizing them into "Decisions", "Action Items", and "Updates" where applicable:\n\n${messageText}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return groqResponse.choices[0].message.content;
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  formatSummary(summary) {
    // Add any additional formatting for Slack message blocks
    return summary;
  }
}

module.exports = { Summarizer };