import path from 'path';
import fs from 'fs';
import { ChatBotConfig } from '../types';
import { DefaultChatbotConfig } from '../config/chatbot';


const objectIsValiableConfig = (obj: ChatBotConfig): obj is ChatBotConfig => {
	return !!obj?.name;
};

export const readBotConfigs = (rootDir: string): ChatBotConfig[] => {
	try {
		const result: ChatBotConfig[] = [];
		const filePaths = fs.readdirSync(rootDir).filter(file => path.extname(file) === '.json').map(fileName => path.join(rootDir, fileName));

		filePaths.forEach(filePath => {
			const obj = JSON.parse(fs.readFileSync(filePath, 'utf8'));
			if (objectIsValiableConfig(obj)) {
				result.push(obj);
			}
		});
		return result;
	} catch (error) {
		return [DefaultChatbotConfig];
	}
};

export const readImageAsBase64 = (filePath: string): string => {
	return fs.readFileSync(filePath, {encoding: 'base64'});
}