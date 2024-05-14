import { Client, Collection, Guild, Message, StageChannel } from 'discord.js';
import 'dotenv/config';
import { OpenAI } from 'openai';
import { ChatbotManager } from './classes/ChatbotManager';
import { DefaultChatbot, ERROR_MESSAGE_500, IMAGE_PATH } from './config/chatbot';
import { DefaultClientIntents } from './config/client';
import { CommandNames, DEFAULT_SUMMARIZE_HOUR } from './config/commands';
import { SummarizeCommand, getChangeChatbotCommand } from './functions/commands';
import { PromptColor, appLog, chatbotLog, coloredLog, errorLog } from './functions/logging';
import { chatCompletion, summarizeDiscordLogs } from './functions/openai';
import { DEFAULT_OPENAI_CHAT_MODEL } from './config/openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { readImageAsBase64 } from './functions/chatbot';


const client = new Client({ intents: DefaultClientIntents });
const token: string = process.env.DISCORD_BOT_TOKEN || '';
const apiKey: string = process.env.OPENAI_APIKEY || '';
const openAIApi = new OpenAI({ apiKey: apiKey });
const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY || ''
});


const chatbotManager = ChatbotManager.fromFiles('./bots');
console.log(appLog(`-- Chatbot load from files --`));
chatbotManager.botNames.forEach((name) => {
	const bot = chatbotManager.getByName(name);
	console.log(appLog(`${coloredLog(name, PromptColor.Cyan, true)} : ${bot?.platform} - ${bot?.model}`))
})

const slashCommands = [getChangeChatbotCommand(chatbotManager.botNames), SummarizeCommand];

client.on('ready', async (client) => {
	console.log(appLog(`Logged in as username: ${coloredLog(client.user?.tag, PromptColor.Cyan, true)}!`));
	client.application.commands.set(slashCommands);

	const guilds = client.guilds.cache;
	guilds.forEach(guild => {
		const initialBot = chatbotManager.getByName(guild.members.me?.nickname || '');
		chatbotManager.change(guild.id, initialBot?.name || '');
		console.log(appLog(`logged in to guild ${coloredLog(guild.name, PromptColor.Green, true)} as nickname ${coloredLog(initialBot?.name || '', PromptColor.Cyan, true)}.`));
	});
});
client.on('interactionCreate', async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	const slashCommand = slashCommands.find(command => command.name === interaction.command?.name);
	if (!slashCommand) return;

	if (slashCommand.name === CommandNames.changeBot) {
		const bot = chatbotManager.findByName(interaction.options.getSubcommand());
		if (!bot) return;
		chatbotManager.change(interaction.guild?.id || '', bot.name);
		interaction.guild?.members.me?.setNickname(bot.name);
		console.log(appLog(`Guild ${coloredLog(interaction.guild?.name || '', PromptColor.Green, true)}'s chatbot is changed to ${coloredLog(bot.name, PromptColor.Cyan, true)}.`));
		if (bot.profileImage) {
			client.user?.setAvatar(IMAGE_PATH + bot.profileImage)
		}
		interaction.reply(`*** ChatBot is changed to  ${bot.name}.*** \n ${bot.greetingMessage}`);
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
		interaction.followUp(`*** ### Here is Summarization of last ${hours} hours. ### *** \n ${summarized}`);
	}
});

client.on('guildCreate', (guild: Guild) => {
	const bot = chatbotManager.current(guild.id);
	if (bot) {
		guild.members.me?.setNickname(bot.name);
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

	let attachImages = []
	// Read image attachments
	if (msg.attachments.size > 0) {

	}
	const attachedImageUrls: string[] = (msg.attachments.size > 0) ?
		msg.attachments
			.filter(attach => !!attach.height && attach.width && attach.url)
			.map(attach => attach.url)
		: []

	msg.channel.sendTyping();
	const bot = chatbotManager.current(msg.guild?.id || '');
	const questionWithAuthor = `${msg.member?.displayName} : '${question}'`

	const model = bot.platform === 'openai' ? openAIApi : anthropic;
	chatCompletion(model, questionWithAuthor, bot || DefaultChatbot, attachedImageUrls)
		.then(({ message, inputToken, outputToken }) => {
			if (!message) return;
			msg.reply(message);
			console.log(chatbotLog('Answer', bot.name, message));
			//Push to log 
			if (inputToken && outputToken) {
				bot.logs.push({
					question: { content: { role: 'user', content: question }, token: inputToken, timestamp: new Date() },
					answers: [{ content: { role: 'assistant', content: message }, token: outputToken, timestamp: new Date() }]
				})
			}
		}).catch((error: Error) => {
			console.log(errorLog(error.message));
			msg.reply(ERROR_MESSAGE_500);
		});

});

client.login(token);