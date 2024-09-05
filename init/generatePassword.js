/*
* This is used to setup Passwords initially
* You can create passwords using the same logic as in the environment
* Prerequisite: You need to have KEY already generated!
* Run the build command from the package.json (npm run build)
* Then call the compiled version of this script using the key as environment variable like so:
* KEY=your-key node ./init/generatePassword.js
* Enter your password
* Copy that to the Environment Variables and .env file
* USER_WHATEVER=
* followed by the output of the console
*/

// Import required modules
const readline = require('readline');
const { crypt } = require('../dist/scripts/crypt');

// Set up readline to read input from the console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});


if (!process.env.KEY) {
  console.error("KEY is missing! Please provide Environment Variable KEY. \nExample: KEY=your-key node ./init/generatePassword.js");
  return;
}


// Prompt user for input
rl.question('Enter Password to be generated: ', async (input) => {
  const cryptedPassword = await crypt(input);
  console.log(cryptedPassword);
  rl.close();
});