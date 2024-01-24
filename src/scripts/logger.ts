// primitive text logger
import fs from 'fs';
import path  from 'path';

const logPath = path.resolve(__dirname, '../httpdocs', 'log.txt');
const date = new Date().toLocaleString('de-DE', { hour12: false });

export default {
	log: (message:string|JSON) => {
		fs.appendFileSync(logPath, `${date} \t|\t ${message} \n`);
		console.log(message);
	},
	error: (message:string|JSON|Response.Error) => {
		fs.appendFileSync(logPath, `${date} \t|\t ERROR: ${message} \n`);
		console.error(message);
	},
}