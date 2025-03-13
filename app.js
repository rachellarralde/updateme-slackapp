require("dotenv").config();
const { App } = require("@slack/bolt");
const { OpenAI } = require("openai");

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: process.env.NODE_ENV !== 'production',
  appToken: process.env.SLACK_APP_TOKEN,
});

// Add connection listeners
app.client.on("connecting", () => {
  console.log("⚡ Connecting to Slack...");
});

app.client.on("connected", () => {
  console.log("⚡ Connected to Slack!");
});

// Add error handling for app
app.error(async (error) => {
  console.error("App error details:", {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack,
  });
});

// In your command handler
app.command("/updateme", async ({ command, ack, client }) => {
  try {
    await ack();
    console.log("Command acknowledged");

    // Try to join the channel if we're not already in it
    try {
      await client.conversations.join({
        channel: command.channel_id,
      });
      console.log("Joined channel successfully");
    } catch (joinError) {
      console.log("Join channel error (might be a DM):", joinError.message);
    }

    // Parse the number of days
    const days = parseInt(command.text) || 7;
    const oldest = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;

    await client.chat.postMessage({
      channel: responseChannel,
      text: `Fetching updates from ${targetChannel || "this channel"} for the last ${days} days...`
    });

    const result = await client.conversations.history({
      channel: channelId || command.channel_id,
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
      text: `Updates from ${targetChannel || "this channel"}:\n${completion.choices[0].message.content}`
    });

  } catch (error) {
    console.error("Error:", error);
    await client.chat.postMessage({
      channel: command.channel_id,
      text: "Error: Make sure to use the correct format: `/updateme [days] [#channel]`"
    });
  }
});

(async () => {
  try {
    await app.start(process.env.PORT || 3000);
    console.log("⚡️ Bolt app is running!");
  } catch (error) {
    console.error("Failed to start app:", {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
  }
})();


// Add app home message handler
app.event('message', async ({ event, client }) => {
  try {
    if (event.channel_type === 'im') {
      const match = event.text.match(/^(?:\/updateme\s+)?(\d+)(?:\s+<#([^|]+)[^>]*>)?$/);
      if (match) {
        const [, days, channelId] = match;
        // Process update request
        await processUpdateRequest(client, event.channel, days, channelId);
      } else {
        await client.chat.postMessage({
          channel: event.channel,
          text: "Please use the format: `7 #channel-name` or just `7` for DM updates"
        });
      }
    }
  } catch (error) {
    console.error('App home message error:', error);
  }
});

// Helper function to process updates
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
