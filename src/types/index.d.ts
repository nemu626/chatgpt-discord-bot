import { ChatCompletionRequestMessage } from 'openai';


export type ChatBotConfig = {
    name: string;
    maxPromptToken?: number;
    temperature?: number;
    profileImage?: string;
    greetingMessage?: string;
    systemMessage?: string;
}

export type ChatMessageWithToken = ChatCompletionRequestMessage & {
    token: number;
}

export type ChatBot = ChatBotConfig & {
    logs: ChatMessageWithToken[]
}