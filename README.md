# Discord GPT chatbot

this is discord chatGPT bot.
template created from [tscord](https://tscord.discbot.app/).

## How to use

create `.env` file on root from `.env.example` and change [Discord tokens](https://discord.com/developers/applications) and [openAI API key](https://platform.openai.com/account/api-keys).

1 create `.env` from `env.example`

```shell
cp .env.example .env
```

2 edit `.env` 

```text
# discord
BOT_TOKEN="YOUR_BOT_TOKEN"
TEST_GUILD_ID="TEST_GUILD_ID"
BOT_OWNER_ID="YOUR_DISCORD_ID"

# openai api
OPENAI_APIKEY=xx-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

3 run bot

```shell
docker compose up -d
```

## 📑 License

MIT License

Copyright (c) barthofu
