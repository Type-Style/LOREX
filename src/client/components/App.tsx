import React from 'react';
import "./css/app.css";
import { Button, Typography } from '@mui/material';


const App = () => {
  return (
    <div className="app">
      <h1 className="headline">Hello, React!</h1>
      <Typography variant='h1'>Test Headline</Typography>
      <Button variant='contained' size='large'>Test</Button>
      <Button variant='contained' size='large' disabled={true}>Test2</Button>
    </div>
  );
}

export default App;

