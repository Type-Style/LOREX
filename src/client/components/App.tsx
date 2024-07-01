import React, { createContext, useState } from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Start from '../pages/Start';
import Login from '../pages/Login';

export const LoginContext = createContext([]);

function loginDefault() {
  const token = sessionStorage?.jwt;
  let exp;
  
  if (token) {
   try {
    exp =  JSON.parse(window.atob(token.split('.')[1])).exp;
    const date = new Date();
    return date.getTime() / 1000 <= exp;
   } catch (error) {
    console.error("Unable to parse JWT Data, for login default state");
    return false;
   }  
  }  
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
  const [isLoggedIn, setLogin] = useState(loginDefault());

  return (
    <LoginContext.Provider value={[isLoggedIn, setLogin]}>
      <RouterProvider router={router} />
    </LoginContext.Provider>
  );
}

export default App;

