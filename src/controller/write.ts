import express from 'express';
import entry from '@src/models/entry';
import { validationResult } from 'express-validator';
import logger from '@src/scripts/logger';


const router = express.Router();
router.use(entry.validate);

// example call: /write?&user=xx&lat=00.000&lon=00.000&timestamp=1704063600000&hdop=0.0&altitude=0.000&speed=0.000&heading=000.0
router.get('/', (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorAsJson = { errors: errors.array() };
    logger.log(JSON.stringify(errorAsJson));
    res.status(422).json(errorAsJson);
    return next();		
  }

  
  //entry.create(req, res);
  //const test = process.env.TEST;

  res.send(`Write: ${JSON.stringify(req.query)}`);

  

  
})



export default router;