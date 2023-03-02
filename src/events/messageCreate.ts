import { ArgsOf, Client } from "discordx"

import { Discord, Guard, On } from "@decorators"
import { Maintenance, NotBot } from "@guards"
import { executeEvalFromMessage, isDev } from "@utils/functions"

import { generalConfig } from "@config"
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
            client.chatContexts.push({ 'role': 'user', 'content': message.content })
            console.log(`[ChatGPT] Query from ${message?.author?.username} :: ${question}`)
            message.channel.sendTyping()
            client.openAiApi.createChatCompletion({
                'model': 'gpt-3.5-turbo',
                messages: client.chatContexts
            })
                .then(response => {
                    if (response.status === 200 && response.data) {
                        const answer: string = response.data?.choices?.[0].message?.content || ''
                        console.log(`[ChatGPT] Answer of GPT :: ${answer}`)
                        client.chatContexts.push({ 'role': 'assistant', 'content': answer})
                        message.reply(answer);
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