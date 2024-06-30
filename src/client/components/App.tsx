import React, { createContext, useState } from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Start from '../pages/Start';
import Login from '../pages/Login';

export const LoginContext = createContext(true);

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
  const [isLoggedIn, setLogin] = useState(true);

  return (
    <LoginContext.Provider value={isLoggedIn}>
      <RouterProvider router={router} />
    </LoginContext.Provider>
  );
}

export default App;

