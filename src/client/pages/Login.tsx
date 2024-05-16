import React from 'react';
import { TextField, Button, InputAdornment } from '@mui/material';
import { AccountCircle, Lock } from '@mui/icons-material';
import "../css/login.css";
import ModeSwitcher from '../components/ModeSwitcher';

function submit(e) {
  e.preventDefault();
  console.log("submit");
}

function Login() {
  return (
    <div className="login">
      <ModeSwitcher/>
      <h1 className="headline">
        Login Page
      </h1>
      <form action="/login" method="post" onSubmit={submit}>
        <TextField
          label="Username"
          variant="filled"
          InputProps={{
            autoFocus: true,
            startAdornment: (
              <InputAdornment position="start">
                <AccountCircle />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Password"
          type="password"
          variant="filled"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Lock />
              </InputAdornment>
            ),
          }}
        />
        <Button
          className="submit"
          variant="contained"
          color="primary"
          type="submit"
        >
          Login
        </Button>
      </form>
    </div>
  )
}

export default Login;