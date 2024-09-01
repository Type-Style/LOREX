import React, { createContext, useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useColorScheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import Start from '../pages/Start';
import Login from '../pages/Login';

export const Context = createContext([]);

export function convertJwt() {
  const token = localStorage?.jwt;
  if (!token) { return false }
  try {
    const { user, exp } = JSON.parse(window.atob(token.split('.')[1]));
    return { user, exp };
  } catch (error) {
    console.error("Unable to parse JWT Data");
    return false;
  }
}

function loginDefault(userInfo) {
  if (!userInfo) { return false; }

  const date = new Date();
  const exp = userInfo.exp
  return date.getTime() / 1000 <= exp;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Start />,
  },
  {
    path: "/login",
    element: <Login />,
  }
]);

const App = () => {
  const [userInfo, setUserInfo] = useState(convertJwt());
  const [isLoggedIn, setLogin] = useState(loginDefault(userInfo));
  const { mode, setMode } = useColorScheme();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  useEffect(() => {
    setMode(prefersDarkMode ? "dark" : "light");
  }, [prefersDarkMode, setMode]);

  return (
    <Context.Provider value={[isLoggedIn, setLogin, userInfo, setUserInfo, mode, setMode, prefersDarkMode]}>
      <RouterProvider router={router} />
    </Context.Provider>
  );
}

export default App;