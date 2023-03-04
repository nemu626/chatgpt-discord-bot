import 'dotenv/config';

import { ChannelType, Client, Guild, GuildBasedChannel, Message, StageChannel } from 'discord.js';
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

client.on('guildCreate', (guild: Guild) => {
    const mainChannel: GuildBasedChannel | undefined = guild.channels.cache.find(ch =>
        ch.type === ChannelType.GuildText &&
        !!guild.members.me &&
        ch.permissionsFor(guild.members.me).has('SendMessages'));
    if (mainChannel?.isTextBased() && process.env.GREETING_MESSAGE) {
        mainChannel.send(process.env.GREETING_MESSAGE);
    }
});

client.on('messageCreate', (msg: Message) => {
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