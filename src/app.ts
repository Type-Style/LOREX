require('module-alias/register');
import { config } from 'dotenv';
import express from 'express';
import toobusy from 'toobusy-js';
// import { rateLimit } from 'express-rate-limit';
// import { slowDown } from 'express-slow-down';
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

app.use((req, res, next) => { // monitor eventloop to block requests if busy
  if (toobusy()) {
    res.status(503).set({ 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Retry-After': '60' }).send("I'm busy right now, sorry.");
  } else { next(); }
});
app.use((req, res, next) => { // clean up IPv6 Addresses
  if (req.ip) { res.locals.ip = req.ip.startsWith('::ffff:') ? req.ip.substring(7) : req.ip; }
  next();
})

// const slowDownLimiter = slowDown({
// 	windowMs: 1 * 60 * 1000,
// 	delayAfter: 5, // Allow 5 requests per 15 minutes.
// 	delayMs: (used) => (used - 5) * 1000, // Add delay after delayAfter is reached
// })

// const rateLimiter = rateLimit({
//   windowMs: 1 * 60 * 1000,
//   limit: 10, // Limit each IP per `window`
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// })

app.use(helmet({ contentSecurityPolicy: { directives: { "default-src": "'self'", "img-src": "*" } } }));
app.use(cache);
app.use(compression())
app.use(hpp());
app.use(function (req, res, next) { // limit request size limit when recieving data
  if (!['POST', 'PUT', 'DELETE'].includes(req.method)) { return next(); }
  getRawBody(req, { length: req.headers['content-length'], limit: '1mb', encoding: true },
    function (err) {
      if (err) { return next(err) }
      next()
    }
  )
})

// routes
app.get('/', (req, res) => {
  res.send('Hello World, via TypeScript and Node.js! ' + res.locals.ip);
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