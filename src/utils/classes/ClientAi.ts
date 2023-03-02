import { Client, ClientOptions } from "discordx";
import { ChatCompletionRequestMessage, OpenAIApi } from 'openai'
import { chatCompletionSystemMessage } from "@config";

export class ClientAi extends Client{
    openAiApi: OpenAIApi; 
    chatContexts: ChatCompletionRequestMessage[]

    constructor(options: ClientOptions, openAiApi: OpenAIApi) {
        super(options);
        this.openAiApi = openAiApi
        this.chatContexts = [chatCompletionSystemMessage]
    }
}