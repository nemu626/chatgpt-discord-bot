import { ActivityType } from "discord.js"
import { Client } from "discordx"
import { injectable } from "tsyringe"

import { logsConfig } from "@config"
import { Discord, Once, } from "@decorators"
import { Data } from "@entities"
import { Database, Logger, Scheduler } from "@services"
import { syncAllGuilds } from "@utils/functions"

@Discord()
@injectable()
export default class ReadyEvent {

    constructor(
        private db: Database,
        private logger: Logger,
        private scheduler: Scheduler
    ) {}

    private activityIndex = 0

    @Once('ready')
    async readyHandler([client]: [Client]) {

        // make sure all guilds are cached
        await client.guilds.fetch()

        // synchronize applications commands with Discord
        await client.initApplicationCommands({
            global: {
                log: logsConfig.debug,
                disable: {
                    delete: false
                }
            },
            guild: {
                log: logsConfig.debug
            }
        })

        // synchronize applications command permissions with Discord
        /**
         * ************************************************************
         * Discord has deprecated permissions v1 api in favour permissions v2, await future updates
         * see https://github.com/discordjs/discord.js/pull/7857
         * ************************************************************
         */
        //await client.initApplicationPermissions(false)


        // update last startup time in the database
        await this.db.get(Data).set('lastStartup', Date.now())

        // start scheduled jobs
        this.scheduler.startAllJobs()

        // log startup
        await this.logger.logStartingConsole()

        // synchronize guilds between discord and the database
        await syncAllGuilds(client)
    }
}