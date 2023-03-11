import { ChatCompletionRequestMessage } from 'openai';


export type ChatBotConfig = {
    name: string;
    maxPromptToken?: number;
    temperature?: number;
    greetingMessage?: string;
    systemMessage?: string;
}

export type ChatMessageWithToken = {
    content: ChatCompletionRequestMessage;
    token: number;
}

export type ChatBot = ChatBotConfig & {
    logs: ChatMessageWithToken[];
    systemPrompt?: ChatMessageWithToken;
}