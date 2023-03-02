import { Client, ClientOptions } from "discordx";
import { OpenAIApi } from 'openai'

export class ClientAi extends Client{
    openAiApi: OpenAIApi; 

    constructor(options: ClientOptions, openAiApi: OpenAIApi) {
        super(options);
        this.openAiApi = openAiApi
    }
}