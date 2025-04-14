import { unzipFile } from './zip.js';

const zipPath = "./httpdocs/tiles.zip";
const extractPath = "./dist/httpdocs/tiles";

unzipFile(zipPath, extractPath).catch((err) => {
  console.error(err);
  process.exit(1);
});