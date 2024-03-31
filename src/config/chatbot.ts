import { TOKEN_MAX_COUNT } from './openai';
import { ChatBot, ChatBotConfig } from '../types';

export const DEFAULT_TEMPERATURE = 0.5;
export const DEFAULT_MAX_PROMPT_TOKEN = TOKEN_MAX_COUNT / 2;
export const DEFAULT_SYSTEM_MESSAGE = 'You are chatbot assistant.';
export const DEFAULT_GREETING_MESSAGE = 'I am a chatbot using chatGPT. Mention me and I will answer you.';
export const DEFAULT_CONTEXT_TIME_THRETHOLD_MINUTES = 30; // 30 minutes.

export const IMAGE_PATH = './bots/images/'

export const ERROR_MESSAGE_500 = ' Sorry, chatGPT API is temporarily not working. Please try again in a few minutes.';


export const DefaultChatbotConfig: ChatBotConfig = {
	name: 'chatgpt',
	platform: 'openai',
	model: 'gpt-4-turbo-preview',
	maxOutputTokenSize: DEFAULT_MAX_PROMPT_TOKEN,
	temperature: DEFAULT_TEMPERATURE,
	greetingMessage: DEFAULT_GREETING_MESSAGE,
	systemMessage: DEFAULT_SYSTEM_MESSAGE,
	profileImage: 'sample.png'
};

export const DefaultChatbot: ChatBot = {
	...DefaultChatbotConfig,
	logs: []
};

