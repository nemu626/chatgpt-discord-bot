
import { Client, GatewayIntentBits, StageChannel } from 'discord.js';
import { Configuration, OpenAIApi } from 'openai';

const client = new Client({
    intents: [
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ]
}
);

const token: string = process.env.DISCORD_BOT_TOKEN || '';
const apiKey: string = process.env.OPENAI_APIKEY || '';

const configuration = new Configuration({
    apiKey: apiKey
});
const openAIApi = new OpenAIApi(configuration);

client.on('ready', () => {
    console.log(`Logged in as ${client.user?.tag}!`);
});

client.on('messageCreate', msg => {
    if (msg.author.bot) return;
    if (!msg.channel || msg.channel instanceof (StageChannel)) return;
    if (msg.content.startsWith('!')) {
        const command = msg.content.substring(1);
        if (command === 'help') {
            msg.channel.send('**Available commands:**\n' +
                '!help - shows this message\n' +
                'any text - send any text to receive GPT-3 generated response');
        }
    } else if (client.user && msg.mentions.has(client.user)) {
        const question = msg.content.replace(/<@(.+)>/, '');
        console.log('* QUESTION:', question);
        msg.channel.sendTyping();
        openAIApi.createCompletion({
            prompt: question,
            model: 'text-davinci-003',
            max_tokens: 256,
        }).then(({ data, status }) => {
            if (data && status === 200) {
                console.log(data);
                const answer = data.choices[0].text || '';
                console.log('* ANSWER   : ', answer);
                msg.reply(answer);
            }
        });
    }
});

client.login(token);