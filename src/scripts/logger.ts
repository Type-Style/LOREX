// primitive text logger
import fs from 'fs';
import path from 'path';
import chalk from "chalk";

const dirPath = path.resolve(__dirname, '../httpdocs/log');
const logPath = path.resolve(dirPath, 'start.txt');

if (!fs.existsSync(dirPath)) {
	fs.mkdirSync(dirPath, { recursive: true });
}

// const logPath = path.resolve(__dirname, '../httpdocs/log', 'start.txt');
const date = new Date().toLocaleString('de-DE', { hour12: false });

export default {
	log: (message: string | JSON, showDateInConsole: boolean = false, showLogInTest = false) => {
		message = JSON.stringify(message);
		fs.appendFileSync(logPath, `${date} \t|\t ${message} \n`);
		if (showDateInConsole) {
			message = `${chalk.dim(date + ":")} ${message}`;
		}
		if (process.env.NODE_ENV == "development" || showLogInTest && process.env.NODE_ENV == "test") {
			console.log(message);
		}
	},
	error: (content: string | Response.Error) => {
		// logfile
		const applyErrorPrefix = !/^\[\w+\]/.test(typeof content == "string" ? content : content.message);
		const logMessageTemplate = `${date} \t|\t${applyErrorPrefix ? ' [ERROR]' : ''} ${typeof content == "string" ? content : JSON.stringify(content.message) } \n`;
		fs.appendFileSync(logPath, logMessageTemplate);
		if (process.env.NODE_ENV == "production") { return; }

		// console
		if (typeof content != "string" && Object.hasOwnProperty.call(content, "message")) {
			const messageAsString = JSON.stringify(content.message);
			if (content.stack) { // replace redundant information
				content.stack = content.stack.replace(messageAsString, "");
			}
			const consoleMessage = structuredClone(content); // create clone so response output is not "further" affected
			consoleMessage.message = messageAsString; // gitbash output improvement (w/o objects in arrays appear as [Object])
			content = consoleMessage;
		} else if (typeof content == "string") {
			const prefix = content.match(/^\[\w+\]/);
			if (prefix?.length) {
				content = content.replace(prefix[0], chalk.red(prefix[0]));
			}
		}
		console.error(content); // log string right away or processed Object

	}
}
