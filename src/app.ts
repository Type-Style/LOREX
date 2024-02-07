require('module-alias/register');
import { config } from 'dotenv';
import express from 'express';
import toobusy from 'toobusy-js';
import compression from 'compression';
import helmet from 'helmet';
import hpp from 'hpp';
import getRawBody from 'raw-body';
import cache from './cache';
import * as error from "./error";
import writeRouter from '@src/controller/write';
import readRouter from '@src/controller/read';
import path from 'path';
import logger from '@src/scripts/logger';

// configurations
config(); // dotenv

const app = express();
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "default-src": "'self'",
      "img-src": "*"
    }
  }
}));
app.use((req, res, next) => {
  if (toobusy()) { 
    res.status(503).send("I'm busy right now, sorry.");
   // todo add headers retry after and no cache
  } else { next(); }
});
app.use(cache);
app.use(compression())
app.use(hpp());

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

app.get('/test', function (req, res) {
  // processing the request requires some work!
  let i = 0;
  while (i < 1e10) i++;
  res.send("I counted to " + i);
});


app.use('/write', writeRouter);
app.use('/read', readRouter);

// use httpdocs as static folder
app.use('/', express.static(path.join(__dirname, 'httpdocs'), {
  extensions: ['html', 'txt', "pdf"],
  index: ["start.html", "start.txt"],
}));

// error handling
app.use(error.notFound);
app.use(error.handler);

// init server
const server = app.listen(80, () => {
  logger.log(`Server running //localhost:80, ENV: ${process.env.NODE_ENV}`, true);
});

// catching shutdowns
['SIGINT', 'SIGTERM', 'exit'].forEach((signal) => {
  process.on(signal, () => {
    function logAndExit() {
      // calling .shutdown allows your process to exit normally
      toobusy.shutdown();
      logger.log(`Server shutdown on signal: ${signal} //localhost:80`, true);
      process.exit();
    }
    if (signal != "exit") { // give the server time to shutdown before closing
      server.close(logAndExit);
    } else {
      logger.log(`Server shutdown immediate: ${signal} //localhost:80`, true);
    }
  });
});

// last resort error handling
process.on('uncaughtException', function (err) {
  console.error('Caught exception:', err);
  logger.error(err);
  server.close();
  process.exit(1);
});