import { CommandNames } from './../config/commands';
import { ApplicationCommandOptionType, ApplicationCommandSubCommandData, ChatInputApplicationCommandData } from 'discord.js';

const getSubCommand = (name: string): ApplicationCommandSubCommandData => {
	return {
		type: ApplicationCommandOptionType.Subcommand,
		name: name,
		description: `Change character to ${name}`
	};
};

export const getChangeChatbotCommand = (names: string[]): ChatInputApplicationCommandData => ({
	description: 'Change character of chatbot',
	name: CommandNames.changeBot,
	options: names.map(name => getSubCommand(name))
});


export const SummarizeCommand: ChatInputApplicationCommandData = {
	description: 'Summarize log of this channel last N hours.',
	name: CommandNames.summarize,
	options: [{
		type: ApplicationCommandOptionType.Number,
		name: 'n',
		max_value: 24,
		min_value: 1,
		description: 'last N hour'
	}, {
		type: ApplicationCommandOptionType.Boolean,
		name: 'includebot',
		description: 'include chatlog by bot(default: false)',
		required: false,
	}]
};

export const VoiceLogCommand: ChatInputApplicationCommandData = {
	description: 'STT for your voice channel.',
	name: CommandNames.voiceLog,
	options: []
}