import React from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useColorScheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import Start from './Start';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Start />,
  }
]);

const App = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const { mode, setMode } = useColorScheme();
  setMode(prefersDarkMode ? "dark" : "light");

  return (
    <RouterProvider router={router} />
  );
}

export default App;

