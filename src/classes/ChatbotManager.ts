import { ChatBotConfig, ChatBot } from '../types';
import path from 'path';
import fs from 'fs';
import { DefaultChatbot } from '../config/chatbot';
import { getTokenLength } from '../functions/openai';


export class ChatbotManager {
	private bots: ChatBot[];
	public indexGuildMap: Map<string, number>;

	constructor(configs?: ChatBotConfig[]) {
		this.indexGuildMap = new Map();
		if (!configs) {
			this.bots = [];
			return;
		}
		this.bots = configs.map(config => ({
			...config,
			logs: [],
			systemPrompt: config.systemMessage ? {
				content: { content: config.systemMessage, role: 'system' },
				token: getTokenLength(config.systemMessage)
			} : undefined
		}));
	}
	get botNames(): string[] {
		return this.bots.map(bot => bot.name);
	}
	public getByName(botName: string): ChatBot | undefined {
		return this.bots.find(bot => bot.name === botName);
	}

	public current(guildId: string): ChatBot {
		return this.bots[this.indexGuildMap.get(guildId) || 0];
	}

	public change(guildId: string, botName: string): void {
		const botIndex = this.bots.findIndex(bot => bot.name === botName);
		if (!botIndex || !botName) return;
		this.indexGuildMap.set(guildId, botIndex);
	}

	public findByName(botName: string): ChatBot | undefined {
		return this.bots.find(bot => bot.name === botName);
	}

	public static fromFiles(rootDir: string): ChatbotManager {

		const objectIsValiableConfig = (obj: ChatBotConfig): obj is ChatBotConfig => !!obj?.name;
		try {
			const bots: ChatBotConfig[] = [];
			const filePaths = fs.readdirSync(rootDir).filter(file => path.extname(file) === '.json').map(fileName => path.join(rootDir, fileName));

			filePaths.forEach(filePath => {
				const obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));
				if (objectIsValiableConfig(obj)) {
					bots.push(obj);
				}
			});
			return new ChatbotManager(bots);
		} catch (error) {
			return new ChatbotManager([DefaultChatbot]);
		}
	}
}