import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { create as createError } from '@src/error';
import { NextFunction, Response } from 'express';
import logger from '@src/scripts/logger';

export const createFile = (res: Response, next: NextFunction): File.Obj => {
	const date = new Date();
	const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
	const dirPath = path.resolve(__dirname, '../data');
	const filePath = path.resolve(dirPath, `data-${formattedDate}.json`);

	if (!fs.existsSync(dirPath)){
			fs.mkdirSync(dirPath, { recursive: true });
			logger.log("data folder did not exist, but created now"); 
	}

	let fileExisted = true;
	if (!fs.existsSync(filePath)) { // check if file exist
			fileExisted = false;
			try {
					// fs.appendFileSync(filePath, 'test');
					fs.writeFileSync(filePath, '');
			} catch (err) {
					createError(res, 500, "File cannot be written to", next);
			}
	}

	return { path: filePath, content: fileExisted ? undefined : '' }; // if the file did not exist before, the content is emptyString
};




const readFileAsync = promisify(fs.readFile);

export async function readAsJson(res: Response, filePath: string, next: NextFunction): Promise<JSON | '' | undefined> {
	const data = await readFileAsync(filePath, 'utf-8');
	console.log(data);

	if (data === '') {
		return '';
	}
	try {		
		return JSON.parse(data);
	} catch (err) {		
		createError(res, 500, "File contains wrong content", next);
		return undefined;
	}
}
