import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { create as createError } from '@src/error';
import { NextFunction, Response } from 'express';
import logger from '@src/scripts/logger';

export const getFile = (res: Response, next: NextFunction): File.Obj => {
	const date = new Date();
	const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
	const dirPath = path.resolve(__dirname, '../data');
	const filePath = path.resolve(dirPath, `data-${formattedDate}.json`);

	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
		logger.log("data folder did not exist, but created now");
	}

	let fileExisted = true;
	if (!fs.existsSync(filePath)) { // check if file exist
		fileExisted = false;
		try {
			fs.writeFileSync(filePath, '{"entries": []}');
			logger.log(`file: ${filePath} did not exist, but created now`);
		} catch (err) {
			createError(res, 500, "File cannot be written to", next);
		}
	}

	return { path: filePath, content: fileExisted ? undefined : JSON.parse('{"entries": []}') }; // if the file did not exist before, the content is emptyString
};


const readFileAsync = promisify(fs.readFile);

export async function readAsJson(res: Response, filePath: string, next: NextFunction): Promise<Models.IEntries | undefined> {
	const data = await readFileAsync(filePath, 'utf-8');

	try {
		return JSON.parse(data);
	} catch (err) {
		createError(res, 500, "File contains wrong content: " + filePath, next);
	}
}


export const write = (res:Response, fileObj:File.Obj, next: NextFunction) => {

	if (!fs.existsSync(fileObj.path)) { // check if file exist
		createError(res, 500, "Can not write to file that does not exist: " + fileObj.path, next);
	}
	try {
		const content = JSON.stringify(fileObj.content, undefined, 2);
		fs.writeFileSync(fileObj.path, content);
		fileObj.content = JSON.parse(content);
		logger.log(`written to file: ${fileObj.path} ${fileObj.content ? fileObj.content?.entries.length - 1 : ''}`);
	} catch (err) {
		createError(res, 500, `File (${fileObj.path}) cannot be written to`, next);
	}	

	return fileObj; // if the file did not exist before, the content is emptyString
};
