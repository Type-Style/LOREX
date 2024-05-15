import React from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Start from '../pages/Start';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Start />,
  }
]);

const App = () => {


  return (
    <RouterProvider router={router} />
  );
}

export default App;

