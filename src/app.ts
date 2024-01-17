import express from 'express';
import { Request, Response } from 'express';
import fs from 'fs';
import path  from 'path';
import writeRouter from "./controller/write";

const app = express();

// routes
app.get('/', (req: Request, res: Response) => {
  res.send('Hello World, via TypeScript and Node.js!');  
});

app.use('/write', writeRouter);


// use httpdocs as static folder
app.use('/', express.static(path.join(__dirname, 'httpdocs')))

// init server
app.listen(80, () => {
  const date = new Date().toLocaleString('de-DE', { hour12: false });
  const logPath = path.join(__dirname, 'httpdocs', 'log.txt');
  fs.appendFileSync(logPath, `Express: Server:  ${date} \n`);
  
  console.log(`Server läuft unter http://localhost:80`); 
});