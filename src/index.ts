import 'dotenv/config';
import { readBotConfigs } from './functions/chatbot';
import { ChatBot, ChatBotConfig } from './types/index.d';
import { ChannelType, Client, Guild, GuildBasedChannel, Message, StageChannel } from 'discord.js';
import { Configuration, OpenAIApi } from 'openai';
import { DefaultClientIntents } from './config/client';
import { chatCompletion } from './functions/openai';
import { DefaultChatbot, ERROR_MESSAGE_500 } from './config/chatbot';
import { getChangeChatbotCommand } from './functions/commands';
import { get_encoding } from '@dqbd/tiktoken';

const tokenizer = get_encoding('cl100k_base');

const client = new Client({ intents: DefaultClientIntents });
const token: string = process.env.DISCORD_BOT_TOKEN || '';
const apiKey: string = process.env.OPENAI_APIKEY || '';
const openAIApi = new OpenAIApi(new Configuration({ apiKey: apiKey }));


const botConfigs: ChatBotConfig[] = readBotConfigs('./bots');
console.log('[System] Read and initialize bots... :: ', ...botConfigs.map(config => config.name));
const bots: ChatBot[] = botConfigs.map(config => (
	{
		...config,
		logs: [],
		systemPrompt: config.systemMessage ? {
			content: { content: config.systemMessage, role: 'system' },
			token: tokenizer.encode(config.systemMessage).length
		} : undefined
	}));

let currentBotIndex = 0;
const slashCommands = [getChangeChatbotCommand(bots.map(bot => bot.name))];

client.on('ready', (client) => {
	console.log(`Logged in as ${client.user?.tag}!`);
	client.application.commands.set(slashCommands);
});
client.on('interactionCreate', async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	const slashCommand = slashCommands.find(command => command.name === interaction.command?.name);
	if (slashCommand) {
		const botIndex = bots.findIndex(bot => bot.name === interaction.options.getSubcommand());
		currentBotIndex = botIndex;
		interaction.guild?.members.me?.setNickname(bots[currentBotIndex].name);
		interaction.reply(`ChatBot is changed to  ${bots[currentBotIndex].name}.\n ${bots[currentBotIndex].greetingMessage}`);
		if (bots[currentBotIndex].profileImage)
			client.user?.setAvatar(bots[currentBotIndex].profileImage || '');
	}
});

client.on('guildCreate', (guild: Guild) => {
	if (bots[currentBotIndex]) {
		guild.members.me?.setNickname(bots[currentBotIndex].name);
		if (bots[currentBotIndex].profileImage)
			client.user?.setAvatar(bots[currentBotIndex].profileImage || '');
	}
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
			msg.reply(ERROR_MESSAGE_500);
		});

});

client.login(token);