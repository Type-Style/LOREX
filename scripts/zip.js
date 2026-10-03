import { ZipArchive } from 'archiver';
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';

// Zip a folder
export const zipFolder = async (folderPath, zipPath) => {
  const output = fs.createWriteStream(zipPath);
  const archive = new ZipArchive({
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
    const zip = new AdmZip(zipPath);
    const targetDir = path.resolve(extractPath);

    // refuse archives with entries resolving outside the target dir (zip slip)
    for (const entry of zip.getEntries()) {
      const destination = path.resolve(targetDir, entry.entryName);
      if (destination !== targetDir && !destination.startsWith(targetDir + path.sep)) {
        throw new Error(`Refusing to extract outside target dir: ${entry.entryName}`);
      }
    }

    zip.extractAllTo(targetDir, true);
    console.log(`Zip file extracted to: ${extractPath}`);
  } catch (err) {
    console.error('Extraction error:', err);
    // rethrow so callers keep the source zip and fail instead of reporting success
    throw err;
  }
};
