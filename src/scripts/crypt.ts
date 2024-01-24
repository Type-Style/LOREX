const crypto = require('crypto');

export const crypt = function (value:string) { 
	return crypto.createHmac('sha256', process.env.KEYA).update(value).digest("base64");
};