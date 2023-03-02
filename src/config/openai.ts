import { ChatCompletionRequestMessage, Configuration } from 'openai'
export const openApiConfig: Configuration = new Configuration({
    apiKey: process.env['OPENAI_APIKEY'] || ''
})

export const chatCompletionSystemMessage: ChatCompletionRequestMessage = {
    'role': 'system', 'content': process.env.OPENAI_CHAT_SYSTEM || 'You are able assistant.'
};