import express from 'express';
import { Request, Response } from 'express';
import fs from 'fs';
import path  from 'path';

const app = express();
const port = 80;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World, via TypeScript and Node.js!');  
});

app.listen(port, () => {
  const date = new Date().toLocaleString('de-DE', { hour12: false });
  const logPath = path.join(__dirname, 'httpdocs', 'log.txt');
  fs.appendFileSync(logPath, `Express: Server:  ${date} \n`);
  
  console.log(`Server läuft unter http://localhost:${port}`);  
});
