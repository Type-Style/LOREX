import React, { useState } from 'react';
import { TextField, Button, InputAdornment } from '@mui/material';
import { AccountCircle, Lock, HighlightOff } from '@mui/icons-material';
import "../css/login.css";
import ModeSwitcher from '../components/ModeSwitcher';
import axios from 'axios';
import qs from 'qs';


function Login() {
  const [formInfo, updateFormInfo] = useState({
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

  const isFormValid = formInfo.user.value && !formInfo.user.isError && formInfo.password.value && !formInfo.password.isError; //&& formInfo.token;

  function updateField(name: string, value: string) {
    const hasError = validateField(name, value, false);
    const newObj = { ...formInfo, [name]: { ...formInfo[name], value: value } }
    if (!hasError) { newObj[name].isError = false } // remove error state while typing but don't add before blur event
    updateFormInfo(newObj)
  }

  function validateField(name: string, value: string, update = true) {
    const isError = value.length <= 1;
    if (update) {
      updateFormInfo({ ...formInfo, [name]: { ...formInfo[name], isError: isError } })
    } else {
      return isError;
    }
  }

  async function submit(e) {
    e.preventDefault();

    const bodyFormData = { "user": formInfo.user.value, "password": formInfo.password.value };
    try {
      const response = await axios({
        method: "post",
        url: "/login",
        data: qs.stringify(bodyFormData),
        headers: { "content-type": "application/x-www-form-urlencoded" }
      })

      console.log(response);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="login">
      <ModeSwitcher />
      <div className="wrapper cut">
        <h1 className="headline">
          Login Page
        </h1>
        <form action="/login" method="post" onSubmit={submit}>
          <TextField
            label="Username"
            variant="filled"
            value={formInfo.user.value}
            onChange={(e) => updateField(e.target.name, e.target.value)}
            onBlur={(e) => validateField(e.target.name, e.target.value)}
            error={formInfo.user.isError}
            helperText={formInfo.user.isError ? formInfo.user.message : false}
            required
            InputProps={{
              classes: {
                root: "cut",
              },
              autoFocus: true,
              name: "user",
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle />
                </InputAdornment>
              ),
              endAdornment: formInfo.user.isError ? (
                <InputAdornment position="end">
                  <HighlightOff color="error" />
                </InputAdornment>
              ) : null
            }}
          />

          <TextField
            label="Password"
            type="password"
            variant="filled"
            value={formInfo.password.value}
            onChange={(e) => updateField(e.target.name, e.target.value)}
            onBlur={(e) => validateField(e.target.name, e.target.value)}
            required
            error={formInfo.password.isError}
            helperText={formInfo.password.isError ? formInfo.password.message : false}
            InputProps={{
              classes: {
                root: "cut",
              },
              name: "password",
              startAdornment: (
                <InputAdornment position="start">
                  <Lock />
                </InputAdornment>
              ),
              endAdornment: formInfo.password.isError ? (
                <InputAdornment position="end">
                  <HighlightOff color="error" />
                </InputAdornment>
              ) : null
            }}
          />
          <input onChange={(e) => updateFormInfo({ ...formInfo, [e.target.name]: e.target.value })} type="hidden" id="csrfToken" value={formInfo.token} name="csrfToken" />
          <Button
            className="submit cut"
            variant="contained"
            color="primary"
            type="submit"
            disabled={!isFormValid}
          >
            Login
          </Button>
        </form>
      </div>
    </div>
  )
}

export default Login;
