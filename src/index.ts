import 'dotenv/config';
import { readBotConfigs } from './functions/chatbot';
import { ChatBot, ChatBotConfig } from './types/index.d';
import { ChannelType, Client, Collection, Guild, GuildBasedChannel, Message, StageChannel } from 'discord.js';
import { Configuration, OpenAIApi } from 'openai';
import { DefaultClientIntents } from './config/client';
import { chatCompletion, summarizeDiscordLogs } from './functions/openai';
import { DefaultChatbot, ERROR_MESSAGE_500 } from './config/chatbot';
import { getChangeChatbotCommand, SummarizeCommand } from './functions/commands';
import { get_encoding } from '@dqbd/tiktoken';
import { CommandNames, DEFAULT_SUMMARIZE_HOUR } from './config/commands';
import { PromptColor, appLog, chatbotLog, coloredLog, errorLog } from './functions/logging';

const tokenizer = get_encoding('cl100k_base');

const client = new Client({ intents: DefaultClientIntents });
const token: string = process.env.DISCORD_BOT_TOKEN || '';
const apiKey: string = process.env.OPENAI_APIKEY || '';
const openAIApi = new OpenAIApi(new Configuration({ apiKey: apiKey }));


const botConfigs: ChatBotConfig[] = readBotConfigs('./bots');
console.log(appLog(`Reading bot config files:  ${coloredLog(botConfigs.map(config => config.name).join(', '), PromptColor.Cyan, true)}`));
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
const slashCommands = [getChangeChatbotCommand(bots.map(bot => bot.name)), SummarizeCommand];

client.on('ready', (client) => {
	console.log(appLog(`Logged in as username: ${coloredLog(client.user?.tag, PromptColor.Cyan, true)}!`));
	client.application.commands.set(slashCommands);

	const initialBot = bots.find(bot => bot.name === client.guilds.cache.at(0)?.members.me?.nickname);
	if (initialBot) {
		currentBotIndex = bots.indexOf(initialBot);
		console.log(appLog(`Bot initialized as ${coloredLog(initialBot.name, PromptColor.Cyan, true)}`));
	}
});
client.on('interactionCreate', async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	const slashCommand = slashCommands.find(command => command.name === interaction.command?.name);
	if (!slashCommand) return;

	if (slashCommand.name === CommandNames.changeBot) {
		const botIndex = bots.findIndex(bot => bot.name === interaction.options.getSubcommand());
		currentBotIndex = botIndex;
		interaction.guild?.members.me?.setNickname(bots[currentBotIndex].name);
		interaction.reply(`ChatBot is changed to  ${bots[currentBotIndex].name}.\n ${bots[currentBotIndex].greetingMessage}`);
		if (bots[currentBotIndex].profileImage)
			client.user?.setAvatar(bots[currentBotIndex].profileImage || '');
	}
	if (slashCommand.name === CommandNames.summarize) {
		interaction.deferReply();
		const hours = interaction.options.getNumber('n') || DEFAULT_SUMMARIZE_HOUR;
		const logStartTimestamp = new Date().getTime() - (hours * 60 * 60 * 1000);
		const includeBot = interaction.options.getBoolean('includebot');
		const channelLogs: Collection<string, Message>[] = [];
		let lastId = interaction.channel?.lastMessageId ?? undefined;
		let lastTimeStamp = interaction.channel?.lastMessage?.createdTimestamp || new Date().getTime();
		while (lastTimeStamp > logStartTimestamp) {
			const logs = await interaction.channel?.messages.fetch({ limit: 100, before: lastId });
			if (!logs) break;
			lastTimeStamp = logs?.last()?.createdTimestamp || 0;
			lastId = logs?.lastKey();
			channelLogs.push(logs);
		}
		const concated = new Collection<string, Message>().concat(...channelLogs).reverse();
		concated.sweep(message => message.createdTimestamp <= logStartTimestamp || (!includeBot && message.author.bot));
		const messages = concated.map(logs => `${logs.author.username} : ${logs.cleanContent}`);
		const summarized = await summarizeDiscordLogs(openAIApi, messages, interaction.locale);

		if (!summarized) {
			interaction.followUp('Sorry. Failed to Summarization.');
			return;
		}
		interaction.followUp(`-- - Here is Summarization of last ${hours} hours. -- - \n ${summarized}`);
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
	console.log(chatbotLog('Question', msg.author?.username || '', question));

	msg.channel.sendTyping();

	chatCompletion(openAIApi, question, bots[currentBotIndex] || DefaultChatbot)
		.then(data => {
			if (!data) return;
			const answer: string = data.choices?.[0].message?.content || '';
			msg.reply(answer);
			console.log(chatbotLog('Answer', bots[currentBotIndex].name, answer));
			//Push to log 
			if (!data.usage?.prompt_tokens || !data.usage?.completion_tokens) return;
			bots[currentBotIndex].logs.push({ content: { role: 'user', content: question }, token: data.usage?.prompt_tokens });
			bots[currentBotIndex].logs.push({ content: { role: 'assistant', content: answer }, token: data.usage?.completion_tokens });
		}).catch((error: Error) => {
			console.log(errorLog(error.message));
			msg.reply(ERROR_MESSAGE_500);
		});

});

client.login(token);