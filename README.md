# chatgpt-discord-bot
discord-bot for chatGPT.
to use this, set the discord token and openai api key to `.env` file.

```shell
cp .env.example .env
# input token and apikey
vi .env

npm run start
```

# Usage 

## Step1. Setting up the environment variable file
Please set the environment variables with reference to .env.example. You will need the Discord bot's API KEY and the API KEY of the AI service (OpenAI or Anthropic) you will be using.

## Step2. Customize or create your bot
see `bots/sample.json`. you can customize default bot by editing this file,
or, by placing json files in this folder with the same structure as `sample.json`, you can add another bots.

structure of bot json
```typescript
{
    "name": "chatgpt", // display name(nickname) of this bot
    "platform": "openai", // 'openai' or 'anthropic'
    "model": "gpt-4-turbo-preview", 
    "temperature": 0.5,  // Higher values are less accurate but more talkative.
    "systemMessage": "You are helpful chatbot.", 
    "greetingMessage": "Hello, I am chatGPT. Mention me and I will answer you.", 
    "maxOutputTokenSize": 4096, // Upper limit of length of bot's response
    "threadTimeLimitMinutes": 30, // The bot remembers the history until this time (minutes) passes.
    "profileImage": "sample.png" // place this file in `/bots/images/`
}
```
If you are not sure which model to use, see below.
* openai : https://platform.openai.com/docs/models/overview 
* anthropic https://docs.anthropic.com/claude/docs/models-overview


## Step3. Execution
If you want to run it natively, prepare a runtime environment for node.js and execute the following:
```shell
# native run
npm install
npm run start
```

Alternatively, you can run it using Docker and Docker Compose.
```shell
# docker 
docker run -d --name discord_chatgpt_bot -p 4000:4000 -v "$(pwd)/bots:/app/bots" --env-file .env --restart=always discord_chatgpt_bot
```

```shell
# docker-compose
docker compose up -d 
```