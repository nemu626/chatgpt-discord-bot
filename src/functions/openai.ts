import Anthropic from '@anthropic-ai/sdk';
import { get_encoding } from '@dqbd/tiktoken';
import { LocaleString } from 'discord.js';
import { OpenAI as OpenAIApi, toFile } from 'openai';
import { DEFAULT_CONTEXT_TIME_THRETHOLD_MINUTES, DEFAULT_MAX_PROMPT_TOKEN, DEFAULT_TEMPERATURE } from '../config/chatbot';
import { DEFAULT_CLAUDE3_CHAT_MODEL, DEFAULT_OPENAI_CHAT_MODEL, SUMMARIZE_INPUT_TOKEN_MAX, SUMMARIZE_SYSTEM_MESSAGE } from '../config/openai';
import { ChatBot, ChatQA, ChatResponseData, Message } from '../types';
import { ChatCompletionContentPart } from 'openai/resources';

const tokenizer = get_encoding('cl100k_base');

export const chatCompletion = async (model: OpenAIApi | Anthropic, question: string, bot: ChatBot, attachedImageUrls: string[] = []): Promise<ChatResponseData> => {
	const contextTimeLimitMs = (bot.threadTimeLimitMinutes || DEFAULT_CONTEXT_TIME_THRETHOLD_MINUTES) * 1000 * 60;
	const logPrompts = cutOffLogsByTime(bot.logs, contextTimeLimitMs)
	const content: string | ChatCompletionContentPart[] = attachedImageUrls.length ?
		[
			{ type: 'text', text: question },
			...attachedImageUrls.map<ChatCompletionContentPart>(url => ({ type: 'image_url', 'image_url': { url: url } }))
		]
		: question;
	if (model instanceof OpenAIApi && bot.platform === 'openai') {
		const response = await model.chat.completions.create({
			model: bot.model || DEFAULT_OPENAI_CHAT_MODEL,
			temperature: bot.temperature ?? DEFAULT_TEMPERATURE,
			max_tokens: bot.maxOutputTokenSize ?? DEFAULT_MAX_PROMPT_TOKEN,
			messages: [
				{ 'role': 'system', 'content': bot.systemMessage || '' },
				...logPrompts,
				{ 'role': 'user', 'content': content }]
		});
		return {
			message: response.choices?.[0].message?.content || undefined,
			inputToken: response.usage?.prompt_tokens,
			outputToken: response.usage?.completion_tokens,
		}
	} else if (model instanceof Anthropic && bot.platform === 'anthropic') {
		const response = await model.messages.create({
			system: bot.systemMessage,
			model: bot.model || DEFAULT_CLAUDE3_CHAT_MODEL,
			temperature: bot.temperature ?? DEFAULT_TEMPERATURE,
			messages: [...logPrompts, { 'role': 'user', 'content': question }],
			max_tokens: bot.maxOutputTokenSize ?? DEFAULT_MAX_PROMPT_TOKEN,
		})
		return {
			message: response.content.map(content => content.text).join('\n'),
			inputToken: response.usage.input_tokens,
			outputToken: response.usage.output_tokens,
		}
	}
	return {};

};

export const summarizeDiscordLogs = async (openai: OpenAIApi, logs: string[], language?: LocaleString): Promise<string> => {
	let tokenSum = 0;
	let content = '';
	for (let i = logs.length - 1; i > 0 && tokenSum < SUMMARIZE_INPUT_TOKEN_MAX; i--) {
		tokenSum += getTokenLength(logs[i]);
		content = content.concat(logs[i], '\n');
	}
	const response = await openai.chat.completions.create({
		model: DEFAULT_OPENAI_CHAT_MODEL,
		temperature: DEFAULT_TEMPERATURE,
		messages: [{ role: 'system', content: SUMMARIZE_SYSTEM_MESSAGE[language || 'en-US'] || '' }, { role: 'user', content: content }]
	});
	if (!response?.choices[0]?.message) return Promise.reject();
	return response.choices[0].message.content || '';
};

// `timeThrethold`ms以前のログをコンテキストに含めない
export const cutOffLogsByTime = (qas: ChatQA[], timeThrethold: number): Message[] => {
	const now: number = new Date().getTime();

	return qas
		.filter((qa) => (now - qa.question.timestamp.getTime()) < timeThrethold)
		.flatMap(qa => [qa.question, ...qa.answers])
		.map(chatWithToken => (chatWithToken.content))
};

export const getTokenLength = (message: string): number => {
	return tokenizer.encode(message).length;
};

export const whisper = async (model: OpenAIApi, audioBuffer: ArrayBuffer ): Promise<string> => {
	const transcription = await model.audio.transcriptions.create({
		model: 'whisper-1',
		file: await toFile(audioBuffer, 'file.wav', {type: 'audio/wav'})
	})
	return transcription.text;
} 