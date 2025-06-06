require('module-alias/register');
import { config } from 'dotenv';
import express from 'express';
import path from 'path';
import toobusy from 'toobusy-js';
import compression from 'compression';
import helmet from 'helmet';
import hpp from 'hpp';
import cache from './middleware/cache';
import * as error from "./middleware/error";
import writeRouter from '@src/controller/write';
import readRouter from '@src/controller/read';
import loginRouter from '@src/controller/login';
import logger from '@src/scripts/logger';
import { baseRateLimiter, cleanup as cleanupRateLimitedIps } from './middleware/limit';
import { cleanupCSRF, cleanupEphemeralSecrets } from "@src/scripts/token";

// configurations
config(); // dotenv

const app = express();
app.disable("x-powered-by");

app.set('view engine', 'ejs');

app.use((req, res, next) => { // monitor eventloop to block requests if busy
  if (toobusy()) {
    res.status(503).set({ 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Retry-After': '60' }).send("I'm busy right now, sorry.");
  } else { next(); }
});
app.use((req, res, next) => { // clean up IPv6 Addresses
  if (req.ip) {
    res.locals.ip = req.ip.startsWith('::ffff:') ? req.ip.substring(7) : req.ip;
    next();
  } else {
    const message = "No IP provided";
    logger.error(message);
    res.status(400).send(message);
  }
})

if (process.env.NODE_ENV != "development") {
  app.use(helmet({ contentSecurityPolicy: { directives: { "default-src": "'self'", "img-src": ["*", "data:"] } },  referrerPolicy: { policy: "strict-origin-when-cross-origin" } }));
}
app.use(cache);
app.use(compression())
app.use(hpp());
app.use(baseRateLimiter);
app.use((req, res, next) => { // limit body for specific http methods
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return express.urlencoded({ limit: '0.5kb', extended: true })(req, res, next);
  }
  next();
});

app.set('trust proxy',true); 

// routes
app.get(['/', '/login'], (req, res) => {
  res.render("index", {"root": process.env.ROOT});
});

app.use('/write', writeRouter);
app.use('/read', readRouter);
app.use('/login', loginRouter);

// use httpdocs as static folder
app.use('/', express.static(path.join(__dirname, 'httpdocs'), {
  extensions: ['html', 'txt', "pdf", "css", "js"],
  index: ["start.html", "start.txt"],
}));

// error handling
app.use(error.notFound);
app.use(error.handler);

// init server
const server = app.listen(80, () => {
  logger.log(`☆ Server running //localhost:80, NODE_ENV: ${process.env.NODE_ENV}`, true);
});

// scheduled cleanup
setInterval(() => {
  cleanupCSRF();
  cleanupRateLimitedIps();
  cleanupEphemeralSecrets();
}, 1000 * 60 * 5);

// catching shutdowns
['SIGINT', 'SIGTERM', 'exit'].forEach((signal) => {
  process.on(signal, () => {
    function logAndExit() {
      // calling .shutdown allows your process to exit normally
      toobusy.shutdown();
      logger.log(`☾ Server shutdown on signal: ${signal} //localhost:80`, true);
      process.exit();
    }
    if (signal != "exit") { // give the server time to shutdown before closing
      server.close(logAndExit);
    } else {
      logger.log(`☽ Server shutdown immediate: ${signal} //localhost:80`, true);
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