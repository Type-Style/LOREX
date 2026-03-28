import archiver from 'archiver';
import fs from 'fs';
import decompress from 'decompress';

// Zip a folder
export const zipFolder = async (folderPath, zipPath) => {
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 5 }
  });

  output.on('close', () => {
    console.log(`Zip file created: ${zipPath}`);
  });

  archive.on('error', (err) => {
    console.error(err);
  });

  archive.pipe(output);
  await archive.directory(folderPath, false).finalize();
};

// Unzip a file
export const unzipFile = async (zipPath, extractPath) => {
  try {
    await decompress(zipPath, extractPath);
    console.log(`Zip file extracted to: ${extractPath}`);
  } catch (err) {
    console.error('Extraction error:', err);
  }
};
