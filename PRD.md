# Slack "Catch-Up" Plugin - Product Requirements Document (PRD)

## 1. Overview

The Slack "Catch-Up" plugin enables users to quickly catch up on key updates missed during an absence (e.g., vacation, sick leave). It leverages Groq’s fast AI inference to summarize important messages from specified Slack channels based on tags, keywords, and mentions, delivering a concise, bullet-point summary.

## 2. Goals

- Deliver a **bullet-point summary** of critical Slack updates missed during a user’s absence.
- Enable users to trigger a **/catchup** command for on-demand summaries.
- Provide an optional **auto-summary** delivered via DM upon a user’s return.
- Offer **customization** options for channels, keywords, and preferences.

## 3. Tech Stack

- **Backend**: Node.js (handles Slack interactions and summarization pipeline)
- **Database**: PostgreSQL (stores user preferences and message history)
- **APIs**:
  - Slack API (message collection and delivery)
  - Groq API (fast AI-powered summarization)
- **Framework**: Bolt.js (Slack app development)
- **Environment**: Cursor IDE (development and testing)

## 4. Functional Requirements

### 4.1 Core Features

1. **Message Collection**

   - Fetch messages from user-specified Slack channels.
   - Filter messages by:
     - Date range (user-defined absence period)
     - Mentions (`@user`, `@channel`, `@here`)
     - Keywords (customizable by user)

2. **Summarization**

   - Use Groq API to generate a concise bullet-point summary.
   - Categorize key points into sections (e.g., "Decisions," "Deadlines," "Announcements").
   - Leverage Groq’s speed for near-instant summarization.

3. **User Interaction**

   - `/catchup` command to trigger an on-demand summary.
   - Optional auto-summary sent via DM when the user returns (opt-in feature).
   - Interactive UI buttons (e.g., "Expand Summary," "Show More Details").

4. **Customization**
   - Allow users to configure:
     - Channels to monitor
     - Keywords to track
     - Auto-summary delivery preferences

### 4.2 Non-Functional Requirements

- **Performance**: Summarize messages in **under 2 seconds** ( leveraging Groq’s fast inference).
- **Security**: Adhere to Slack OAuth scopes and ensure user data privacy.
- **Scalability**: Support up to **100 monitored channels** per user.

## 5. Slack App Setup Instructions

1. Create a Slack app in the [Slack API Dashboard](https://api.slack.com/apps).
2. Configure OAuth permissions:
   - `channels:history` (fetch channel messages)
   - `chat:write` (send DMs)
   - `users:read` (retrieve user info)
3. Install the app to your workspace and obtain:
   - `SLACK_BOT_TOKEN`
   - `SLACK_SIGNING_SECRET`

## 6. API Integration

### 6.1 Slack API Endpoints

- `conversations.history` (retrieve channel messages)
- `chat.postMessage` (deliver summary via DM)

### 6.2 Groq API Integration

- Use Groq’s OpenAI-compatible API endpoint with a chosen model (e.g., `llama3-8b-8192` or `mixtral-8x7b-32768` for fast summarization).
- Replace OpenAI’s base URL with Groq’s: `https://api.groq.com/openai/v1`.
- Obtain a Groq API key from [GroqCloud Developer Console](https://console.groq.com).

Example payload:

```javascript
const groqResponse = await groq.createChatCompletion({
  model: "llama3-8b-8192", // Fast and efficient model
  messages: [
    {
      role: "user",
      content: `Summarize this in bullet points: ${messageText}`,
    },
  ],
  max_tokens: 500,
});
```

**Note**: Groq’s API is designed for speed, so expect lower latency compared to OpenAI. Adjust `max_tokens` based on summary length needs.

## 7. Key Components

1. **Slack Listener**: Captures the `/catchup` command.
2. **Message Collector**: Gathers and filters messages based on user criteria.
3. **Summarizer**: Processes messages via Groq API and formats output into bullet points.
4. **Summary Delivery**: Sends the formatted summary to the user via Slack DM.

## 8. Milestones

1. **Week 1**: Set up Slack app and implement message collection.
2. **Week 2**: Integrate Groq API for summarization and test speed.
3. **Week 3**: Build `/catchup` command and auto-summary feature.
4. **Week 4**: Add user customization, perform testing, and deploy.

## 9. Future Enhancements

- Sentiment analysis to prioritize urgent or critical messages.
- Multi-user summaries for team-wide updates.
- Enhanced UI with filters and message previews.

## 10. Deployment

- **Local Testing**: Use **ngrok** to test Slack interactions locally.
- **Production**: Deploy to **AWS Lambda** or **Vercel** for scalability.

## 11. Environment Variables

```
SLACK_BOT_TOKEN=<your-slack-bot-token>
SLACK_SIGNING_SECRET=<your-slack-signing-secret>
GROQ_API_KEY=<your-groq-api-key>
DATABASE_URL=<your-postgres-url>
```

---

## Key Changes and Rationale

1. **Swapped OpenAI for Groq**:

   - Updated the API integration section to use Groq’s endpoint (`https://api.groq.com/openai/v1`) and API key (`GROQ_API_KEY`).
   - Selected a Groq-supported model (e.g., `llama3-8b-8192`) optimized for speed and efficiency.
   - Emphasized Groq’s low-latency advantage, reducing summarization time from 5 seconds (OpenAI) to under 2 seconds.

2. **Simplified API Payload**:

   - Kept the structure OpenAI-compatible since Groq supports it, but added a specific prompt (`Summarize this in bullet points`) to ensure Groq delivers the desired output format.

3. **Performance Goals**:

   - Adjusted the non-functional requirement for summarization time to reflect Groq’s faster inference capabilities.

4. **Documentation**:
   - Added a reference to the GroqCloud Developer Console for obtaining an API key, ensuring clarity for setup.

This revised PRD leverages Groq’s strengths—speed and OpenAI compatibility—while maintaining your original vision for the Slack "Catch-Up" plugin. Let me know if you’d like further refinements!
