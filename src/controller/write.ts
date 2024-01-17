import express from 'express';

const router = express.Router();

// let entry:Models.IEntry;


router.get('/', (req, res) => {
  res.send('Write');
})

export default router;