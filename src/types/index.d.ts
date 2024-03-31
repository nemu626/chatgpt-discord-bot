import { ChatCompletionRequestMessage } from 'openai';


export type ChatBotConfig = {
    platform: AiPlatform;
    model: string;
    name: string;
    maxOutputTokenSize?: number;
    temperature?: number;
    greetingMessage?: string;
    systemMessage?: string;
    threadTimeLimitMinutes?: number;
}

export type Message = {
    content: string;
    role: 'user' | 'assistant';
}

export type ChatMessageWithToken = {
    content: Message;
    token: number;
    timestamp: Date;
}
export type ChatQA = {
    question: ChatMessageWithToken;
    answers: ChatMessageWithToken[];
}

export type AnthropicChatMessageWithToken = {
    content: MessageParam;
    token: number;
    timestamp: Date;
}

export type ChatBot = ChatBotConfig & {
    logs: ChatQA[];
}

export type AiPlatform = 'openai' | 'anthropic';

export type ChatResponseData = {
    message?: string;
    inputToken?: number;
    outputToken?: number;
}