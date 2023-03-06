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
	name: 'changebot',
	options: names.map(name => getSubCommand(name))
});

