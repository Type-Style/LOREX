import * as bcrypt from 'bcrypt';

export const crypt = {

	cryptPassword: (password: string) => {
		return bcrypt.genSalt(10)
			.then((salt => bcrypt.hash(password, salt)))
			.then(hash => hash);
	}		
}