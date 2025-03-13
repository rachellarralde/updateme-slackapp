const { getPool } = require('../config/database');

class MessageCollector {
  constructor(app) {
    this.app = app;
    this.pool = getPool();
  }

  async getMessages(userId, startDate = null, endDate = null) {
    try {
      // Get user preferences
      const userPrefs = await this.getUserPreferences(userId);
      if (!userPrefs || !userPrefs.monitored_channels.length) {
        throw new Error('No monitored channels configured');
      }

      const messages = [];
      
      // Fetch messages from each monitored channel
      for (const channelId of userPrefs.monitored_channels) {
        const result = await this.app.client.conversations.history({
          channel: channelId,
          oldest: startDate ? Math.floor(startDate.getTime() / 1000) : undefined,
          latest: endDate ? Math.floor(endDate.getTime() / 1000) : undefined
        });

        const filteredMessages = this.filterMessages(result.messages, userPrefs.keywords, userId);
        messages.push(...filteredMessages);

        // Store messages in history
        await this.storeMessages(channelId, userId, filteredMessages);
      }

      return messages;
    } catch (error) {
      console.error('Error collecting messages:', error);
      throw error;
    }
  }

  async getUserPreferences(userId) {
    const result = await this.pool.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  }

  filterMessages(messages, keywords, userId) {
    return messages.filter(msg => {
      // Check for mentions
      const hasMention = msg.text.includes(`<@${userId}>`) ||
                        msg.text.includes('@channel') ||
                        msg.text.includes('@here');

      // Check for keywords
      const hasKeyword = keywords.some(keyword =>
        msg.text.toLowerCase().includes(keyword.toLowerCase())
      );

      return hasMention || hasKeyword;
    });
  }

  async storeMessages(channelId, userId, messages) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      for (const msg of messages) {
        await client.query(
          `INSERT INTO message_history 
           (channel_id, user_id, message_text, timestamp, is_mention)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            channelId,
            userId,
            msg.text,
            new Date(msg.ts * 1000),
            msg.text.includes(`<@${userId}>`)
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = { MessageCollector };