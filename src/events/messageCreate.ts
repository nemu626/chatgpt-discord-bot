import { ArgsOf } from "discordx"

import { Discord, Guard, On } from "@decorators"
import { Maintenance } from "@guards"
import { executeEvalFromMessage, isDev } from "@utils/functions"

import { CHAT_MODEL_STRING, generalConfig, shiftMessages } from "@config"
import { ClientAi } from "@utils/classes"
import { trimReply } from "@utils/functions"

@Discord()
export default class MessageCreateEvent {

    @On("messageCreate")
    @Guard(
        Maintenance,
    )
    async messageCreateHandler(
        [message]: ArgsOf<"messageCreate">,
        client: ClientAi
    ) {

        if (client.user && message.mentions?.has(client.user)) {
            const question = trimReply(message.content)
            client.chatContexts.push({ 'role': 'user', 'content': question })
            console.log(`[ChatGPT] Query from ${message?.author?.username} :: ${question}`)
            message.channel.sendTyping()
            client.openAiApi.createChatCompletion({
                'model': CHAT_MODEL_STRING,
                temperature: 0.5,
                messages: client.chatContexts
            })
                .then(response => {
                    if (response.status === 200 && response.data) {
                        const answer: string = response.data?.choices?.[0].message?.content || ''
                        console.log(`[ChatGPT] Answer of GPT :: ${answer}`)
                        // console.log(`[ChatGPT] INFO :: token: ${response.data.usage?.prompt_tokens}, ${response.data.usage?.completion_tokens}`)
                        message.reply(answer);
                        client.chatContexts.push({ 'role': 'assistant', 'content': answer})
                        client.chatContexts = shiftMessages(client.chatContexts, response.data.usage?.total_tokens || 0)
                    }
                })
                .catch(error => {
                    console.log('Error while ChatGPT Request.', error)
                })
        }

        // eval command
        if (
            message.content.startsWith(`\`\`\`${generalConfig.eval.name}`)
            && (
                (!generalConfig.eval.onlyOwner && isDev(message.author.id))
                || (generalConfig.eval.onlyOwner && message.author.id === generalConfig.ownerId)
            )
        ) {
            executeEvalFromMessage(message)
        }

        await client.executeCommand(message, { caseSensitive: false })
    }

}