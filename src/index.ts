import 'dotenv/config';
import { readBotConfigs } from './functions/chatbot';
import { ChatBot, ChatBotConfig } from './types/index.d';
import { ChannelType, Client, Guild, GuildBasedChannel, Message, StageChannel } from 'discord.js';
import { Configuration, OpenAIApi } from 'openai';
import { DefaultClientIntents } from './config/client';
import { chatCompletion } from './functions/openai';
import { DefaultChatbot } from './config/chatbot';

const client = new Client({ intents: DefaultClientIntents });
const token: string = process.env.DISCORD_BOT_TOKEN || '';
const apiKey: string = process.env.OPENAI_APIKEY || '';
const openAIApi = new OpenAIApi(new Configuration({ apiKey: apiKey }));


const botConfigs: ChatBotConfig[] = readBotConfigs('./src/bots');
console.log('[System] Read and initialize bots... :: ', ...botConfigs.map(config => config.name));
const bots: ChatBot[] = botConfigs.map(config => ({ ...config, logs: [], systemPrompt: config.systemMessage ? { content: { content: config.systemMessage, role: 'system' }, token: 400 } : undefined }));
// bots.forEach(async bot => {
// 	if (bot.systemMessage) {
// 		// const token = await getPromptTokenLength(openAIApi, bot.systemMessage);
// 		// TODO: remove fake token number;
// 		const token = 400;
// 		bot.systemPrompt = { content: { role: 'system', content: bot.systemMessage }, token: token };
// 	}
// });

const currentBotIndex = 0;

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

	chatCompletion(openAIApi, question, bots[currentBotIndex] || DefaultChatbot)
		.then(data => {
			if (!data) return;
			const answer: string = data.choices?.[0].message?.content || '';
			msg.reply(answer);
			console.log(`[Answer] chatGPT :: ${answer}`);
			//Push to log 
			if (!data.usage?.prompt_tokens || !data.usage?.completion_tokens) return;
			bots[currentBotIndex].logs.push({ content: { role: 'user', content: question }, token: data.usage?.prompt_tokens });
			bots[currentBotIndex].logs.push({ content: { role: 'assistant', content: answer }, token: data.usage?.completion_tokens });
		}).catch((error: Error) => {
			console.log(`[Error] :: ${error.message},`);
		});

});

client.login(token);