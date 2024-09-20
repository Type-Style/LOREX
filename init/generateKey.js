/*
* Usage: open console run:  node init/generateKey.js
* type desired key and hit enter
* copy output to .env add a line starting with:
* KEY=
* directly followed by your output
*/

// Import required modules
const readline = require('readline');

// set up readline to read input from the console
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Prompt user for input
rl.question('Enter the string to be encoded: ', (input) => {
  // encode to escape special chars
  const escapedString = encodeURIComponent(input);

  // convert the escaped string to base64
  const base64String = Buffer.from(escapedString).toString('base64');

  // print the result
  console.log('encoded String:', base64String);

  rl.close();
});