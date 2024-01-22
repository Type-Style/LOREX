require('module-alias/register');
import { config } from 'dotenv';
import express from 'express';
import hpp from 'hpp';
import cache from './cache';
import * as error from "./error";
import writeRouter from '@src/controller/write';
import path  from 'path';
import logger from '@src/scripts/logger';


// configurations
config();
const app = express();
app.use(hpp());
app.use(cache);

// routes
app.get('/', (req, res) => {
  res.send('Hello World, via TypeScript and Node.js!');  
});
app.use('/write', writeRouter);

// use httpdocs as static folder
app.use('/', express.static(path.join(__dirname, 'httpdocs')))

// error handling
app.use(error.notFound);
app.use(error.handler);

// init server
app.listen(80, () => {
  logger.log(`Server running //localhost:80`); 
});