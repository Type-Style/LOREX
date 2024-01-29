// primitive text logger
import fs from 'fs'; // typescript will compile to require
import path  from 'path'; // typescript will compile to require
import chalk from "chalk"; // keep import syntax after compile

const logPath = path.resolve(__dirname, '../httpdocs', 'log.txt');
const date = new Date().toLocaleString('de-DE', { hour12: false });

export default {
	log: (message:string|JSON, showDateInConsole:boolean=false, showLogInTest=false) => {
		message = JSON.stringify(message);
		fs.appendFileSync(logPath, `${date} \t|\t ${message} \n`);
		if (showDateInConsole) {
			message = `${chalk.dim(date + ":")} ${message}`;
		}
		if (process.env.NODE_ENV == "development" || showLogInTest && process.env.NODE_ENV == "test") {
			console.log(message);
		}
	},
	error: (message:string|JSON|Response.Error) => {
		fs.appendFileSync(logPath, `${date} \t|\t ERROR: ${message} \n`);
		console.error(message);
	}
}
