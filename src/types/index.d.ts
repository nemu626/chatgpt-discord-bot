import { ChatCompletionRequestMessage } from 'openai';


export type ChatBotConfig = {
    platform: AiPlatform;
    model: string;
    name: string;
    maxOutputTokenSize?: number;
    temperature?: number;
    greetingMessage?: string;
    systemMessage?: string;
}

export type ChatMessageWithToken = {
    content: ChatCompletionRequestMessage;
    token: number;
    timestamp: Date;
}

export type AnthropicChatMessageWithToken = {
    content: MessageParam;
    token: number;
    timestamp: Date;
}

export type ChatBot = ChatBotConfig & {
    logs: ChatMessageWithToken[];
    systemPrompt?: ChatMessageWithToken;
}

export type AiPlatform = 'openai' | 'anthropic';

export type ChatResponseData = {
    message?: string;
    inputToken?: number;
    outputToken?: number;
}