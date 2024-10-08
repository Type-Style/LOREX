import React, { createContext, useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useColorScheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import Start from '../pages/Start';
import Login from '../pages/Login';
import axios from "axios";

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
  const [mapToken, setMapToken] = useState<string | null>(null);

  const contextObj = {isLoggedIn, setLogin, userInfo, setUserInfo, mode, setMode, prefersDarkMode, mapToken}

  useEffect(() => {
    setMode(prefersDarkMode ? "dark" : "light");
  }, [prefersDarkMode, setMode]);


  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchToken = async () => {
      try {
        const token = localStorage.getItem("jwt");
        const response = await axios.get("/read/maptoken", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setMapToken(response.data.mapbox);
      } catch (error) {
        console.error("Error fetching map token:", error);
      }
    };

    fetchToken();
  }, [isLoggedIn]);

  return (
    <Context.Provider value={[contextObj]}>
      <RouterProvider router={router} />
    </Context.Provider>
  );
}

export default App;