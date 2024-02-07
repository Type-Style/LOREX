require('module-alias/register');
import { config } from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import getRawBody from 'raw-body';
import cache from './cache';
import * as error from "./error";
import writeRouter from '@src/controller/write';
import readRouter from '@src/controller/read';
import path  from 'path';
import logger from '@src/scripts/logger';

// configurations
config();
const app = express();
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": "'self'",        
        "img-src": "*"
      }
    }
  })
);

app.use(hpp());
app.use(cache);

app.use(function (req, res, next) {
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return next()
  }
  getRawBody(req, {
    length: req.headers['content-length'],
    limit: '1mb',
    encoding: true
  }, function (err) {
    if (err) { return next(err) }
    next()
  })
})

// routes
app.get('/', (req, res) => {
  res.send('Hello World, via TypeScript and Node.js!');  
});


app.use('/write', writeRouter);
app.use('/read', readRouter);

// use httpdocs as static folder
app.use('/', express.static(path.join(__dirname, 'httpdocs'), {
  extensions: ['html', 'txt', "pdf"],
  index: "start.html", 
}));

// error handling
app.use(error.notFound);
app.use(error.handler);

// init server
app.listen(80, () => {
  logger.log(`Server running //localhost:80, ENV: ${process.env.NODE_ENV}`, true); 
});

process.on('uncaughtException', function(err) {
  console.error('Caught exception:', err);
  logger.error(err);
  process.exit(1);
});