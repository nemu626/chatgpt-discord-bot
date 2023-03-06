import { DEFAULT_TEMPERATURE, DEFAULT_MAX_PROMPT_TOKEN } from './../config/chatbot';
import { ChatBot, ChatMessageWithToken } from './../types/index.d';
import { CreateChatCompletionResponse, OpenAIApi, CreateChatCompletionRequest, ChatCompletionRequestMessage } from 'openai';
import { OPENAI_CHAT_MODEL } from '../config/openai';

export const chatCompletion = async (openai: OpenAIApi, question: string, bot: ChatBot): Promise<CreateChatCompletionResponse> => {
	const logPrompts = createLogPrompt(bot.logs, bot.maxPromptToken || DEFAULT_MAX_PROMPT_TOKEN, bot.systemPrompt);
	const response = await openai.createChatCompletion({
		model: OPENAI_CHAT_MODEL,
		temperature: bot.temperature ?? DEFAULT_TEMPERATURE,
		messages: [...logPrompts, { 'role': 'user', 'content': question }]
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

export const createLogPrompt = (messages: ChatMessageWithToken[], tokenLimit: number, systemMessage?: ChatMessageWithToken): ChatCompletionRequestMessage[] => {
	if (systemMessage?.token && systemMessage.token > tokenLimit) return [];

	const limit = tokenLimit - (systemMessage?.token ?? 0);
	let sum = 0;
	const result: ChatCompletionRequestMessage[] = [];
	for (let i = messages.length - 1; i > 0; i--) {
		if (sum + messages[i].token > limit)
			break;
		result.push(messages[i].content);
		sum += messages[i].token;
	}
	if (systemMessage) result.push(systemMessage.content);
	return result.reverse();
};