import React, { useContext, useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import LoginIcon from '@mui/icons-material/Login';
import CheckIcon from '@mui/icons-material/Check';
import ModeSwitcher from '../components/ModeSwitcher';
import axios from 'axios';
import qs from 'qs';
import { Context } from '../context';
import { convertJwt } from "../scripts/convertJwt";
import { useNavigate } from 'react-router-dom';
import LinearBuffer from '../components/LinearBuffer';
import "../css/login.css";
import { Message } from "../components/Message";

function Login() {
  const [finish, setFinish] = useState(1);
  const [start, setStart] = useState(1);
  const navigate = useNavigate();
  const [contextObj] = useContext(Context);

  const [formInfo, updateFormInfo] = useState({
    user: {
      isError: false,
      message: "Minimum 2",
      value: typeof contextObj.userInfo == "object" ? contextObj.userInfo.user : ""
    },
    password: {
      isError: false,
      message: "Enter Password",
      value: ""
    },
    token: ""
  });
  const [isLoading, setLoading] = useState(false);
  const [messageObj, setMessageObj] = useState<Omit<client.entryData, 'fetchTimeData'>>({ isError: false, status: 200, message: "" });

  const isFormValid = formInfo.user.value && !formInfo.user.isError && formInfo.password.value && !formInfo.password.isError;

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

  function redirect() {
    setTimeout(() => { setLoading(false); navigate("/") }, 1000);
  }

  async function submit(e) {
    e.preventDefault();
    const date = new Date();
    setStart(date.getTime());
    const milliseconds = 9 * 1000; // Estimated bcrypt Time
    setFinish(new Date(date.getTime() + milliseconds).getTime());

    setLoading(true);
    setMessageObj({ isError: false, status: 200, message: "" });


    let token; // get csrf token
    try {
      token = await axios({
        method: "post",
        url: "/login/csrf",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "x-requested-with": "XMLHttpRequest"
        }
      })
      updateFormInfo({ ...formInfo, token: token.data });
    } catch (error) {
      console.log(error);
      setMessageObj({ isError: true, status: error.response?.data?.status || error.response?.status || "499", message: error.response?.data?.message || error.response?.statusText || error.message })
    }

    if (!token) { setLoading(false); return; } // skip when the first request has an error

    // collect data and convert to urlencoded string then send
    const bodyFormData = { "user": formInfo.user.value, "password": formInfo.password.value, csrfToken: token.data };
    try {
      const response = await axios({
        method: "post",
        url: "/login",
        data: qs.stringify(bodyFormData),
        headers: { "content-type": "application/x-www-form-urlencoded" }
      })
      const token = response.data.token;
      localStorage.setItem("jwt", token);
      contextObj.setLogin(true);
      setMessageObj({ isError: false, status: <CheckIcon />, message: "Success!" })


      // update linearBar for delay until redirect
      const date = new Date();
      setStart(date.getTime());
      setFinish(new Date(date.getTime() + 1000).getTime());
      contextObj.setUserInfo(convertJwt());
      redirect();

    } catch (error) {
      console.log(error);
      setMessageObj({ isError: true, status: error.response?.data?.status || error.response?.status || "499", message: error.response?.data?.message || error.response?.statusText || error.message })

      setLoading(false); // Reset loading after request is complete
    }
  }

  return (
    <div className="login">
      <div className="fixed">
        <ModeSwitcher />
      </div>
      <div className="wrapper cut">
        <h1 className="headline">
          Login Page
        </h1>
        {contextObj.isLoggedIn &&
          <h2 className="headline sub">You are logged in</h2>
        }
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
            autoFocus={!contextObj.userInfo}
            InputProps={{
              classes: {
                root: "cut",
              },
              name: "user",
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircleIcon />
                </InputAdornment>
              ),
              endAdornment: formInfo.user.isError ? (
                <InputAdornment position="end">
                  <HighlightOffIcon color="error" />
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
            autoFocus={!!contextObj.userInfo}
            InputProps={{
              classes: {
                root: "cut",
              },
              name: "password",
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              ),
              endAdornment: formInfo.password.isError ? (
                <InputAdornment position="end">
                  <HighlightOffIcon color="error" />
                </InputAdornment>
              ) : null
            }}
          />
          <input type="hidden" id="csrfToken" value={formInfo.token} name="csrfToken" />
          <div className="subWrapper">
            {messageObj.status ? (
              <p className={`message ${messageObj.isError ? 'message--error' : 'message--success'}`}>
                <Message messageObj={messageObj} page="login" />
              </p>
            ) : null}
            <Button
              className="submit cut"
              variant="contained"
              startIcon={isLoading ? <CircularProgress color="inherit" size={"1em"} /> : <LoginIcon />}
              color="primary"
              type="submit"
              disabled={!isFormValid || isLoading}
            >
              Login
            </Button>
          </div>
          {isLoading && <LinearBuffer msStart={start} msFinish={finish} />}
        </form>
      </div>
      <svg className="bg-pattern" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="url(#repeatingGradient)" />
      </svg>
    </div>
  )
}

export default Login;
