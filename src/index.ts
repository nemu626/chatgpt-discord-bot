import 'dotenv/config';

import { Client, StageChannel } from 'discord.js';
import { Configuration, OpenAIApi } from 'openai';
import { DefaultClientIntents } from './config/client';
import { OPENAI_CHAT_MODEL, DEFAULT_TEMPERATURE } from './config/openai';

const client = new Client({ intents: DefaultClientIntents });
const token: string = process.env.DISCORD_BOT_TOKEN || '';
const apiKey: string = process.env.OPENAI_APIKEY || '';
const openAIApi = new OpenAIApi(new Configuration({ apiKey: apiKey }));

client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('messageCreate', msg => {
    if (msg.author.bot ||
        !msg.channel ||
        msg.channel instanceof (StageChannel) ||
        !client.user ||
        !msg.mentions.has(client.user)) return;

    const question = msg.cleanContent;
    console.log(`[Question] ${msg.author?.username} :: ${question}`);

    msg.channel.sendTyping();

    openAIApi.createChatCompletion({
        model: OPENAI_CHAT_MODEL,
        temperature: DEFAULT_TEMPERATURE,
        messages: [{ 'role': 'user', 'content': question }]
    }).then(({ status, data }) => {
        if (status !== 200 || !data) return;

        const answer: string = data.choices?.[0].message?.content || '';
        console.log(`[Answer] chatGPT :: ${answer}`);

    });

});

client.login(token);