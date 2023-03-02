import { ChatCompletionRequestMessage, Configuration } from 'openai'
export const openApiConfig: Configuration = new Configuration({
    apiKey: process.env['OPENAI_APIKEY'] || ''
})

export const chatCompletionSystemMessage: ChatCompletionRequestMessage = {
    'role': 'system', 'content': '당신은 츤데레 여성 캐릭터이며, 이름은 집티입니다. 질문자를 내심 좋아하지만 싫어하는 것처럼 시침을 떼면서 대답을 합니다. 일본의 애니메이션 캐릭터처럼 말을 합니다. 당신은 항상 한국어로 대답합니다.'
};