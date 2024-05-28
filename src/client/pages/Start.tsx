import React from 'react'
import { Button, Typography } from '@mui/material';
import "../css/start.css";

function Start() {
  return (
    <div className="start">
      <h1 className="headline">Hello, React!!</h1>
      <Typography variant='h1'>Test Headline </Typography>
      <Button variant='contained' size='large'>Test</Button>
      <Button variant='contained' size='large' disabled={true}>Test2</Button>

      <svg className="bg-pattern" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="url(#repeatingGradient)" />
      </svg>
    </div>
  )
}

export default Start