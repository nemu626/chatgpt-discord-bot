import { ChatCompletionRequestMessage, Configuration } from 'openai'
export const openApiConfig: Configuration = new Configuration({
    apiKey: process.env['OPENAI_APIKEY'] || ''
})

export const chatCompletionSystemMessage: ChatCompletionRequestMessage = {
    'role': 'system', 'content': process.env.OPENAI_CHAT_SYSTEM || 'You are able assistant.'
};

export const CHAT_MODEL_STRING = 'gpt-3.5-turbo'
export const MAX_TOKEN_NUMBER = 4009;

export const shiftMessages =  (messages: ChatCompletionRequestMessage[], totalTokenNumber: number): ChatCompletionRequestMessage[] => {

    const answerLimit = Number(process.env.OPENAI_ANSWER_MAX_TOKEN) || Math.floor(MAX_TOKEN_NUMBER / 2)
    const promptLimit = MAX_TOKEN_NUMBER - answerLimit
    
    if ( promptLimit > totalTokenNumber) {
        return messages;
    }
    const systemMessages = messages.filter(message => message.role === 'system');
    const notSystemMessages = messages.filter(message => message.role !== 'system').slice(2)
    return [...systemMessages, ...notSystemMessages]
}