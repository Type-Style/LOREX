import * as bcrypt from "bcrypt";
import crypto from "crypto";

export const crypt = async function (password: string, quick = false) {
	const extendedPassword = pepper(password);
	return await bcrypt.hash(extendedPassword, quick ? 8 : 16);
};

export const compare = async function (password: string, hash: string) {
	const extendedPassword = pepper(password);
	return await bcrypt.compare(extendedPassword, hash)
}

function pepper(password: string) {
	const key = process.env.KEYA;
	if (!key) { throw new Error('KEYA is not defined in the environment variables'); }
	return password + crypto.createHmac('sha256', key).digest("base64");
}


