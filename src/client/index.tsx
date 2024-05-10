import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Experimental_CssVarsProvider as CssVarsProvider, experimental_extendTheme as extendTheme, useColorScheme, getInitColorSchemeScript } from '@mui/material/styles';
import App from "./components/App";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  }
]);


const theme = extendTheme({ // color pallette overwritten in css
  typography: {
    fontFamily: "Science-Gothic, sans-serif",
    fontSize: 20,
  },
});

let darkModeEnabled = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
function setMode(dark:boolean) {
  darkModeEnabled = dark;
  document.documentElement.dataset.muiColorScheme = darkModeEnabled ? "dark" : "light";
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  setMode(event.matches);
});


const container = document.getElementById('react-root');
let root: Root;
if (container) {
  setMode(darkModeEnabled);
  root = createRoot(container);
  root.render(
    <CssVarsProvider theme={theme}>
      <RouterProvider router={router} />
    </CssVarsProvider>
  );
} else {
  console.error("root not found");
}


