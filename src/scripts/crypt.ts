import * as crypto from 'crypto';

export const crypt = function (value:string) {
	const key = process.env.KEYA;
	if (!key) {
			throw new Error('KEYA is not defined in the environment variables');
	}
	return crypto.createHmac('sha256', key).update(value).digest("base64");
};