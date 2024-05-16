import React, { useState } from 'react';
import { TextField, Button, InputAdornment } from '@mui/material';
import { AccountCircle, Lock } from '@mui/icons-material';
import "../css/login.css";
import ModeSwitcher from '../components/ModeSwitcher';

function submit(e) {
  e.preventDefault();
  console.log("submit");
}

function Login() {
  const [formData, updateFormData] = useState({
    user: {
      isError: false,
      message: "Minimum 2",
      value: ""
    },
    password: {
      isError: false,
      message: "Enter Password",
      value: ""
    },
    token: ""
  });

  const isFormValid = formData.user.value !== '' && formData.password.value !== ''; //&& formData.token;

  function updateField(name:string, value:string) {
    const hasError = validateField(name, value, false);
    const newObj = { ...formData, [name] : {...formData[name], value: value }}
    if (!hasError) {newObj[name].isError = false} // remove error state while typing but don't add before blur
    updateFormData(newObj)
  }

  function validateField(name:string, value:string, update = true) {
    const isError = value.length <= 1;
    if (update) {
      updateFormData({ ...formData, [name] : {...formData[name], isError: isError}})
    } else {
      return isError;
    }
  }

  return (
    <div className="login">
      <ModeSwitcher />
      <h1 className="headline">
        Login Page
      </h1>
      <form action="/login" method="post" onSubmit={submit}>
        <TextField
          label="Username"
          variant="filled"
          value={formData.user.value}
          onChange={(e) => updateField(e.target.name, e.target.value)}
          onBlur={(e) => validateField(e.target.name, e.target.value)}
          error={formData.user.isError}
          helperText={formData.user.isError ? formData.user.message : false}
          required
          InputProps={{
            autoFocus: true,
            name: "user",
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
          value={formData.password.value}
          onChange={(e) => updateField(e.target.name, e.target.value)}
          onBlur={(e) => validateField(e.target.name, e.target.value)}
          required
          error={formData.password.isError}
          helperText={formData.password.isError ? formData.password.message : false}
          InputProps={{
            name: "password",
            startAdornment: (
              <InputAdornment position="start">
                <Lock />
              </InputAdornment>
            ),
          }}
        />
        <input onChange={(e) => updateFormData({ ...formData, [e.target.name]: e.target.value })} type="hidden" id="csrfToken" value={formData.token} name="csrfToken" />
        <Button
          className="submit"
          variant="contained"
          color="primary"
          type="submit"
          disabled={!isFormValid}
        >
          Login
        </Button>
      </form>
    </div>
  )
}

export default Login;
