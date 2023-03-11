import { Client, Collection, Guild, Message, StageChannel } from 'discord.js';
import 'dotenv/config';
import { Configuration, OpenAIApi } from 'openai';
import { ChatbotManager } from './classes/ChatbotManager';
import { DefaultChatbot, ERROR_MESSAGE_500 } from './config/chatbot';
import { DefaultClientIntents } from './config/client';
import { CommandNames, DEFAULT_SUMMARIZE_HOUR } from './config/commands';
import { SummarizeCommand, getChangeChatbotCommand } from './functions/commands';
import { PromptColor, appLog, chatbotLog, coloredLog, errorLog } from './functions/logging';
import { chatCompletion, summarizeDiscordLogs } from './functions/openai';


const client = new Client({ intents: DefaultClientIntents });
const token: string = process.env.DISCORD_BOT_TOKEN || '';
const apiKey: string = process.env.OPENAI_APIKEY || '';
const openAIApi = new OpenAIApi(new Configuration({ apiKey: apiKey }));

const chatbotManager = ChatbotManager.fromFiles('./bots');
console.log(appLog(`chatbot load from files:  ${coloredLog(chatbotManager.botNames.join(', '), PromptColor.Cyan, true)}`));

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

	msg.channel.sendTyping();
	const bot = chatbotManager.current(msg.guild?.id || '');

	chatCompletion(openAIApi, question, bot || DefaultChatbot)
		.then(data => {
			if (!data) return;
			const answer: string = data.choices?.[0].message?.content || '';
			msg.reply(answer);
			console.log(chatbotLog('Answer', bot.name, answer));
			//Push to log 
			if (!data.usage?.prompt_tokens || !data.usage?.completion_tokens) return;
			bot.logs.push({ content: { role: 'user', content: question }, token: data.usage?.prompt_tokens });
			bot.logs.push({ content: { role: 'assistant', content: answer }, token: data.usage?.completion_tokens });
		}).catch((error: Error) => {
			console.log(errorLog(error.message));
			msg.reply(ERROR_MESSAGE_500);
		});

});

client.login(token);