import { ChatBotConfig, ChatMessageWithToken } from '../types';

export class Chatbot implements ChatBotConfig {
	name: string;
	maxPromptToken?: number | undefined;
	temperature?: number | undefined;
	greetingMessage?: string | undefined;
	systemMessage?: string | undefined;
	logs: ChatMessageWithToken[];

	constructor(config: ChatBotConfig) {
		this.name = config.name;
		this.maxPromptToken = config.maxPromptToken;
		this.temperature = config.temperature;
		this.greetingMessage = config.greetingMessage;
		this.systemMessage = config.systemMessage;
		this.logs = [];
	}

}