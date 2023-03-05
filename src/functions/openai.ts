import { DEFAULT_TEMPERATURE } from './../config/chatbot';
import { ChatBot } from './../types/index.d';
import { CreateChatCompletionResponse, OpenAIApi } from 'openai';
import { OPENAI_CHAT_MODEL } from '../config/openai';

export const chatCompletion = async (openai: OpenAIApi, question: string, bot: ChatBot): Promise<CreateChatCompletionResponse> => {
	const response = await openai.createChatCompletion({
		model: OPENAI_CHAT_MODEL,
		temperature: bot.temperature ?? DEFAULT_TEMPERATURE,
		messages: question ? [...bot.logs, { 'role': 'user', 'content': question }] : bot.logs
	});
	return response.data;
};

export const getPromptTokenLength = async (openai: OpenAIApi, prompt: string): Promise<number> => {
	const response = await openai.createChatCompletion({
		model: OPENAI_CHAT_MODEL,
		messages: [{ 'role': 'system', 'content': prompt }]
	});
	return response?.data?.usage?.prompt_tokens ?? 0;
};
