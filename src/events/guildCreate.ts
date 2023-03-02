import { ArgsOf, Client } from "discordx"

import { Discord, On } from "@decorators"
import { syncGuild } from "@utils/functions"
import { ChannelType, GuildBasedChannel, PermissionsBitField, TextChannel } from "discord.js"
import { env } from "process"

@Discord()
export default class GuildCreateEvent {

    @On('guildCreate')
    async guildCreateHandler(
        [newGuild]: ArgsOf<'guildCreate'>,
        client: Client
    ) {

        await syncGuild(newGuild.id, client)
        
        const channel: GuildBasedChannel | undefined = newGuild.channels.cache.find(channel =>
            channel.type === ChannelType.GuildText &&
            !!newGuild.members.me &&
            channel.permissionsFor(newGuild.members.me).has('SendMessages'))
        if (channel?.isTextBased() && process.env.GREETING_MESSAGE)
            channel.send(process.env.GREETING_MESSAGE)
    }
}