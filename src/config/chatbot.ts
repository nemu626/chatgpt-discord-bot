import { TOKEN_MAX_COUNT } from './openai';
import { ChatBot } from '../types';

export const DEFAULT_TEMPERATURE = 0.5;
export const DEFAULT_MAX_PROMPT_TOKEN = TOKEN_MAX_COUNT / 2;
export const DEFAULT_SYSTEM_MESSAGE = 'You are chatbot assistant.';
export const DEFAULT_GREETING_MESSAGE = 'I am a chatbot using chatGPT. Mention me and I will answer you.';

export const DefaultChatbot: ChatBot = {
	name: 'chatGPT',
	logs: [],
	maxPromptToken: DEFAULT_MAX_PROMPT_TOKEN,
	temperature: DEFAULT_TEMPERATURE,
	greetingMessage: DEFAULT_GREETING_MESSAGE,
	systemMessage: DEFAULT_SYSTEM_MESSAGE,
};
