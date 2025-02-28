import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { create as createError } from '@src/middleware/error';
import { NextFunction, Response } from 'express';
import logger from '@src/scripts/logger';

export const getFile = (res: Response, next: NextFunction, method: File.method): File.Obj => {
	const date = new Date();
	const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

	const dirPath = path.resolve(__dirname, '../data');
	let filePath = path.resolve(dirPath, `data-${formattedDate}.json`);

	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true });
		logger.log("data folder did not exist, but created now");
	}

	let fileExisted = true;
	let olderFile = false;
	if (!fs.existsSync(filePath)) { // if file does not exist
		fileExisted = false;
		const mostRecentFile = findMostRecentFile(dirPath);
		if (method == "read" && mostRecentFile) { // when reading check old files
			olderFile = true;
			filePath = mostRecentFile;
		} else if (method == "write") {
			try {
				fs.writeFileSync(filePath, '{"entries": []}');
				logger.log(`file: ${filePath} did not exist, but created now`);
			} catch (err) {
				createError(res, 500, "File cannot be written to", next);
			}
		}
	}

	return { path: filePath, content: method == "read" ? (fileExisted || olderFile) : JSON.parse('{"entries": []}') };
};


const readFileAsync = promisify(fs.readFile);

export async function readAsJson(res: Response, filePath: string, next: NextFunction): Promise<Models.IEntries | undefined> {
	const data = await readFileAsync(filePath, 'utf-8');

	try {
		return JSON.parse(data);
	} catch (err) {
		createError(res, 500, "File contains wrong content: " + path.basename(filePath), next);
	}
}


export const write = (res: Response, fileObj: File.Obj, next: NextFunction) => {

	if (!fs.existsSync(fileObj.path)) { // check if file exist
		createError(res, 500, "Can not write to file that does not exist: " + fileObj.path, next);
	}

	if (typeof fileObj.content == "boolean") {
		createError(res, 500, `File (${fileObj.path}) cannot be written to, contents are not correct type`, next);
	}

	try {
		const content = JSON.stringify(fileObj.content, undefined, 2);
		fs.writeFileSync(fileObj.path, content);
		fileObj.content = JSON.parse(content);
		if (typeof fileObj.content != "boolean") {
			logger.log(`🖉  written to file: ${fileObj.path} ${fileObj.content?.entries ? fileObj.content.entries.length - 1 : ''}`);
		}
	} catch (err) {
		createError(res, 500, `File (${fileObj.path}) cannot be written to`, next);
	}

	return fileObj;
};

const findMostRecentFile = (directoryPath: string) => {
	// read all files from the directory
	const files = fs.readdirSync(directoryPath);

	// initialize variables to keep track of the most recent file
	let mostRecentFile = null;
	let mostRecentTime = 0;

	files.forEach((file) => {
		const filePath = path.join(directoryPath, file);

		// get file stats (including modified time)
		const stats = fs.statSync(filePath);

		// check if it is a file (and not a directory) and most recent
		if (stats.isFile() && stats.mtimeMs > mostRecentTime) {
			if (stats.mtimeMs > mostRecentTime) {
				mostRecentTime = stats.mtimeMs;
				mostRecentFile = filePath;
			}
		}
	});

	return mostRecentFile;
}

export const getModificationDate = (filePath: string) : number => {
	const stats = fs.statSync(filePath);
	return stats.mtimeMs;
}
