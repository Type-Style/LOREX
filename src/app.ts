require('module-alias/register');
import { config } from 'dotenv';
import express from 'express';
import hpp from 'hpp';
import fs from 'fs';
import path  from 'path';
import writeRouter from '@src/controller/write';

// configurations
config();
const app = express();
app.use(hpp());

// routes
app.get('/', (req, res) => {
  res.send('Hello World, via TypeScript and Node.js!');  
});

app.use('/write', writeRouter);

// use httpdocs as static folder
app.use('/', express.static(path.join(__dirname, 'httpdocs')))

// init server
app.listen(80, () => {
  const date = new Date().toLocaleString('de-DE', { hour12: false });
  const logPath = path.join(__dirname, 'httpdocs', 'log.txt');
  fs.appendFileSync(logPath, `Express Server started:  ${date} \n`);
  
  console.log(`Server running //localhost:80`); 
});