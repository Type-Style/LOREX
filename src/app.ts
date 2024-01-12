import express from 'express';
import { Request, Response } from 'express';

const app = express();
const port = 80;

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World, via TypeScript and Node.js!');
  
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);  
});