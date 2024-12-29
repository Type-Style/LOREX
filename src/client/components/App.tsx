import React, { Suspense, createContext, useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useColorScheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Start from '../pages/Start';
import axios from "axios";


const Login = React.lazy(() => import('../pages/Login'));

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
    element: (
      <Suspense fallback={<div>Loading...</div>}>
        <Login />
      </Suspense>
    )
  }
]);


const App = () => {
  const [userInfo, setUserInfo] = useState(convertJwt());
  const [isLoggedIn, setLogin] = useState(loginDefault(userInfo));
  const { mode, setMode } = useColorScheme();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [trafficToken, setTrafficToken] = useState<string | null>(null);

  const contextObj = {isLoggedIn, setLogin, userInfo, setUserInfo, mode, setMode, prefersDarkMode, mapToken, trafficToken}

  useEffect(() => {
    setMode(prefersDarkMode ? "dark" : "light");
  }, [prefersDarkMode, setMode]);


  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchToken = async (path:string, setState: React.Dispatch<React.SetStateAction<string | null>>) => {
      try {
        const token = localStorage.getItem("jwt");
        const response = await axios.get(path, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setState(response.data.token);
      } catch (error) {
        console.error(`Error fetching ${path}:`, error);
      }
    };

    fetchToken("/read/maptoken", setMapToken);
    fetchToken("/read/traffictoken", setTrafficToken);
    
  }, [isLoggedIn]);

  return (
    <Context.Provider value={[contextObj]}>
      <RouterProvider router={router} />
    </Context.Provider>
  );
}

export default App;