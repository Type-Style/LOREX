import { ZipArchive } from 'archiver';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import yauzl from 'yauzl';

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

const openZip = (zipPath) => new Promise((resolve, reject) => {
  yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => err ? reject(err) : resolve(zipfile));
});

const openEntryStream = (zipfile, entry) => new Promise((resolve, reject) => {
  zipfile.openReadStream(entry, (err, stream) => err ? reject(err) : resolve(stream));
});

// Extract every entry as a plain file or directory; symlinks are never created.
// yauzl rejects absolute and "../" entry names, the containment check below is a second guard.
const extractZip = async (zipPath, extractPath) => {
  const targetDir = path.resolve(extractPath);
  const zipfile = await openZip(zipPath);

  // autoClose releases the file on 'end'; only close manually when aborting early
  try {
    await new Promise((resolve, reject) => {
      zipfile.on('error', reject);
      zipfile.on('end', resolve);
      zipfile.on('entry', async (entry) => {
        try {
          const destination = path.resolve(targetDir, entry.fileName);
          if (destination !== targetDir && !destination.startsWith(targetDir + path.sep)) {
            throw new Error(`Refusing to extract outside target dir: ${entry.fileName}`);
          }

          if (entry.fileName.endsWith('/')) {
            await fs.promises.mkdir(destination, { recursive: true });
          } else {
            await fs.promises.mkdir(path.dirname(destination), { recursive: true });
            await pipeline(await openEntryStream(zipfile, entry), fs.createWriteStream(destination));
          }
          zipfile.readEntry();
        } catch (err) {
          reject(err);
        }
      });
      zipfile.readEntry();
    });
  } catch (err) {
    if (zipfile.isOpen) zipfile.close();
    throw err;
  }
};

// Unzip a file
export const unzipFile = async (zipPath, extractPath) => {
  try {
    await extractZip(zipPath, extractPath);
    console.log(`Zip file extracted to: ${extractPath}`);
  } catch (err) {
    console.error('Extraction error:', err);
  }
};
