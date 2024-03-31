import { DEFAULT_TEMPERATURE, DEFAULT_MAX_PROMPT_TOKEN } from '../config/chatbot';
import { AnthropicChatMessageWithToken, ChatBot, ChatMessageWithToken, ChatResponseData } from '../types';
import { CreateChatCompletionResponse, OpenAIApi, CreateChatCompletionRequest, ChatCompletionRequestMessage } from 'openai';
import { DEFAULT_CLAUDE3_CHAT_MODEL, DEFAULT_OPENAI_CHAT_MODEL, SUMMARIZE_INPUT_TOKEN_MAX, SUMMARIZE_SYSTEM_MESSAGE } from '../config/openai';
import { get_encoding } from '@dqbd/tiktoken';
import { LocaleString } from 'discord.js';
import Anthropic from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/resources';

const tokenizer = get_encoding('cl100k_base');

export const chatCompletion = async (model: OpenAIApi | Anthropic, question: string, bot: ChatBot): Promise<ChatResponseData> => {
	const logPrompts = createLogPrompt(bot.logs, bot.maxPromptToken || DEFAULT_MAX_PROMPT_TOKEN, bot.systemPrompt);
	if (model instanceof OpenAIApi) {
		const response = await model.createChatCompletion({
			model: bot.model || DEFAULT_OPENAI_CHAT_MODEL,
			temperature: bot.temperature ?? DEFAULT_TEMPERATURE,
			messages: [...logPrompts, { 'role': 'user', 'content': question }]
		});
		return {
			message: response.data.choices?.[0].message?.content,
			inputToken: response.data.usage?.prompt_tokens,
			outputToken: response.data.usage?.completion_tokens,
		}
	} else {
		const nosystemLogs = convertAnthropicLogPrompt(logPrompts)
		const response = await model.messages.create({
			model: bot.model || DEFAULT_CLAUDE3_CHAT_MODEL,
			temperature: bot.temperature ?? DEFAULT_TEMPERATURE,
			messages: [...nosystemLogs, { 'role': 'user', 'content': question }],
			max_tokens: bot.maxPromptToken ?? DEFAULT_MAX_PROMPT_TOKEN,
		})
		return {
			message: response.content.map(content => content.text).join('\n'),
			inputToken: response.usage.input_tokens,
			outputToken: response.usage.output_tokens,
		}
	}

};

export const summarizeDiscordLogs = async (openai: OpenAIApi, logs: string[], language?: LocaleString): Promise<string> => {
	let tokenSum = 0;
	let content = '';
	for (let i = logs.length - 1; i > 0 && tokenSum < SUMMARIZE_INPUT_TOKEN_MAX; i--) {
		tokenSum += getTokenLength(logs[i]);
		content = content.concat(logs[i], '\n');
	}
	const response = await openai.createChatCompletion({
		model: DEFAULT_OPENAI_CHAT_MODEL,
		temperature: DEFAULT_TEMPERATURE,
		messages: [{ role: 'system', content: SUMMARIZE_SYSTEM_MESSAGE[language || 'en-US'] || '' }, { role: 'user', content: content }]
	});
	if (!response?.data?.choices[0]?.message) return Promise.reject();
	return response.data.choices[0].message.content;
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

export const convertAnthropicLogPrompt = (logPrompt: ChatCompletionRequestMessage[]): MessageParam[] => {
	return logPrompt.map(log => log.role === 'system' ? { ...log, role: 'user' } : log) as MessageParam[];
};


export const getTokenLength = (message: string): number => {
	return tokenizer.encode(message).length;
};