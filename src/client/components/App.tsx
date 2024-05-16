import React from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Start from '../pages/Start';
import Login from '../pages/Login';

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


  return (
    <RouterProvider router={router} />
  );
}

export default App;

