import { LocaleString } from 'discord.js';

export const DEFAULT_OPENAI_CHAT_MODEL = 'gpt-3.5-turbo';
export const DEFAULT_CLAUDE3_CHAT_MODEL = 'claude-3-opus-20240229';
export const TOKEN_MAX_COUNT = 4096; //see openai API documents.

export const SUMMARIZE_SYSTEM_MESSAGE: { [key in LocaleString]?: string } = {
	'en-US': 'Below is a chat log from a Discord. Please provide a brief summary of the log.',
	'ko': '다음의 채팅 로그를 간략히 요약해 주세요.',
	'ja': '以下のDiscordのチャットログを簡略に要約してください。'
};

export const SUMMARIZE_INPUT_TOKEN_MAX = TOKEN_MAX_COUNT / 4 * 3;