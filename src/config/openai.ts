import { Configuration } from 'openai'
export const openApiConfig: Configuration = new Configuration({
    apiKey: process.env['OPENAI_APIKEY'] || ''
})
