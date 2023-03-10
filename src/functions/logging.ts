export enum PromptColor {
	Black = '\u001b[30m',
	Red = '\u001b[31m',
	Green = '\u001b[32m',
	Yellow = '\u001b[33m',
	Blue = '\u001b[34m',
	Magenta = '\u001b[35m',
	Cyan = '\u001b[36m',
	White = '\u001b[37m',
}
const BOLD = '\x1b[1m';
const RESET = '\u001b[0m';

export const coloredLog = (log: string, color: PromptColor, isBold?: boolean): string =>
	`${color}${isBold ? BOLD : ''}${log} ${RESET}`;

export const appLog = (log: string): string => `${coloredLog('[System]', PromptColor.Blue, true)} ${log}`;
export const errorLog = (log: string): string => `${coloredLog('[Error]', PromptColor.Red, true)} ${log}`;

export const chatbotLog = (prefix: 'Question' | 'Answer', author: string, log: string): string =>
	`${coloredLog(`[${prefix}]`, PromptColor.Blue, true)}${coloredLog(author + '::', PromptColor.Cyan, true)}${log}`;