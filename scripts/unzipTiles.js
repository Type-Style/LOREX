import { unzipFile } from './zip.js';
import fs from 'fs';

const zipPath = "./tiles.zip";
const extractPath = "./dist/httpdocs/tiles";

if (!fs.existsSync(zipPath)) {
  console.log(`File ${zipPath} does not exist, skipping unzip operation.`);
  process.exit(0); // exit with code 0 to indicate successful script execution
}

unzipFile(zipPath, extractPath).then(() => {
  fs.unlink(zipPath, (err) => {
    if (err) {
      console.error(`Error deleting file ${zipPath}: ${err}`);
    } else {
      console.log(`File ${zipPath} deleted successfully.`);
    }
  });
}).catch((err) => {
  console.error(`Error unzipping file: ${err}`);
  process.exit(1); // exit with code 1 to indicate error
});