require('dotenv').config();
const { App } = require('@slack/bolt');
const { OpenAI } = require('openai');
const { setupDatabase } = require('./config/database');

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

async function startServer() {
  try {
    // Initialize database
    await setupDatabase();

    const app = new App({
      token: process.env.SLACK_BOT_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      socketMode: process.env.NODE_ENV !== 'production',
      appToken: process.env.SLACK_APP_TOKEN,
    });

    // Message handler for direct messages
    app.event('message', async ({ event, client }) => {
      try {
        if (event.channel_type === 'im') {
          const match = event.text.match(/^(\d+)(?:\s+<#([^|]+)[^>]*>)?$/);
          if (match) {
            const [, days, channelId] = match;
            await processUpdateRequest(client, event.channel, days, channelId);
          } else {
            await client.chat.postMessage({
              channel: event.channel,
              text: "Please use the format: `7 #channel-name` or just `7` for DM updates"
            });
          }
        }
      } catch (error) {
        console.error('Message handler error:', error);
      }
    });

    // Process update requests
    async function processUpdateRequest(client, responseChannel, days, channelId) {
      try {
        const targetChannel = channelId ? `<#${channelId}>` : "this conversation";
        
        await client.chat.postMessage({
          channel: responseChannel,
          text: `Fetching updates from ${targetChannel} for the last ${days} days...`
        });

        const result = await client.conversations.history({
          channel: channelId || responseChannel,
          oldest: Math.floor(Date.now() / 1000) - parseInt(days) * 24 * 60 * 60,
          limit: 100
        });

        if (!result.messages?.length) {
          await client.chat.postMessage({
            channel: responseChannel,
            text: "No messages found in the specified time period."
          });
          return;
        }

        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: "Provide an extremely concise 2-3 bullet point summary of key updates and decisions only."
            },
            {
              role: "user",
              content: `Summarize these messages:\n${result.messages.reverse().map(m => m.text).join("\n")}`
            }
          ],
          model: "mixtral-8x7b-32768",
          temperature: 0.5,
          max_tokens: 300
        });

        await client.chat.postMessage({
          channel: responseChannel,
          text: `Updates from ${targetChannel}:\n${completion.choices[0].message.content}`
        });
      } catch (error) {
        console.error('Process update error:', error);
        await client.chat.postMessage({
          channel: responseChannel,
          text: "Error processing update request. Make sure I have access to the channel."
        });
      }
    }

    // Start the app
    const port = process.env.PORT || 3000;
    await app.start(port);
    console.log(`⚡️ Slack app is running on port ${port}`);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
