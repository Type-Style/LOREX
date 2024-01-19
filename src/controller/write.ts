import express from 'express';
import { Request, Response } from 'express';
import entry from '@src/models/entry';

const router = express.Router();

// example call: /write?&user=xxx&lat=00.000&lon=00.000&timestamp=1704063600000&hdop=0.0&altitude=0.000&speed=0.000&heading=000.0
router.get('/', (req:Request, res:Response) => {
  entry.create(req, res);
  console.log(req.query);

  res.send(`Write: ${JSON.stringify(req.query)}`);

  

  
})



export default router;