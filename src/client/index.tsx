import "./components/removeSvgAnimation";
import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import { ThemeProvider, createTheme, extendTheme } from '@mui/material/styles';

import App from "./components/App";

let theme = createTheme({ cssVariables: true });

theme = extendTheme({ // color pallette overwritten in css
  typography: {
    fontFamily: "Science-Gothic, sans-serif",
    fontSize: 20,
  }
});

const container = document.getElementById('react-root');
let root: Root;
if (container) {
  root = createRoot(container);
  root.render(
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
} else {
  console.error("root not found");
}


