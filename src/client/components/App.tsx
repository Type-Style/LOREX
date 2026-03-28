import React, { Suspense, useEffect, useLayoutEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useColorScheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Start from '../pages/Start';
import axios from "axios";
import { convertJwt } from "../scripts/convertJwt";
import { Context } from "../context";


const Login = React.lazy(() => import('../pages/Login'));

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
  const [userInfo, setUserInfo] = useState<false | { user: string; exp: number }>(convertJwt());
  const [isLoggedIn, setLogin] = useState(loginDefault(userInfo));
  const { mode, setMode } = useColorScheme();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [trafficToken, setTrafficToken] = useState<string | null>(null);

  const contextObj:client.AppContext = { isLoggedIn, setLogin, userInfo, setUserInfo, mode, setMode, prefersDarkMode, mapToken, trafficToken }

  useLayoutEffect(() => {
    // patch data attribute (removed from mui in new version)
    const hasDataAttribute = document.documentElement.dataset.muiColorScheme;
    if (!hasDataAttribute) {
      setMode(prefersDarkMode ? "dark" : "light");
    }
    document.documentElement.dataset.muiColorScheme = mode;
  }, [prefersDarkMode, setMode, mode]);


  useEffect(() => {
    if (!isLoggedIn || mapToken && trafficToken) {return;}
    const fetchToken = async (path: string, setState: React.Dispatch<React.SetStateAction<string | null>>) => {
      try {
        const token = localStorage.getItem("jwt");
        const response = await axios.get(path, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setState(response.data.token);
      } catch (error) {
        if (error.response.status >= 400 && error.response.status < 500) {
          setLogin(false);
        }
        console.error(`Error fetching ${path}:`, error);
      }
    };

    fetchToken("/read/maptoken", setMapToken);
    fetchToken("/read/traffictoken", setTrafficToken);

  }, [isLoggedIn, mapToken, trafficToken]);

  return (
    <Context value={[contextObj]}>
      <RouterProvider router={router} />
    </Context>
  );
}

export default App;