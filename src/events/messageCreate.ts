import { ArgsOf, Client } from "discordx"

import { Discord, Guard, On } from "@decorators"
import { Maintenance } from "@guards"
import { executeEvalFromMessage, isDev } from "@utils/functions"

import { generalConfig } from "@config"
import { ClientAi } from "@utils/classes"

@Discord()
export default class MessageCreateEvent {

    @On("messageCreate")
    @Guard(
        Maintenance
    )
    async messageCreateHandler(
        [message]: ArgsOf<"messageCreate">, 
        client: ClientAi
     ) {

        // eval command
        const moderation = await client.openAiApi.createModeration({
            input: message.content,
        })
        if( moderation.status === 200 ) {
            const isSexual = moderation?.data?.results?.some(result => 
                result?.categories?.sexual
            )
            const scores: number[] = moderation?.data?.results.map(res => res.category_scores["sexual"])
            const scoreMessage = scores.map(s => s.toFixed(2)).join();
            if (isSexual) {
                message.channel.send('えっちなのはダメ！死刑！！' + scoreMessage)
            } 
            else {
                message.channel.send(scoreMessage);
            }
        }
        
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