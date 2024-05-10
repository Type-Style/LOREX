import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import { Experimental_CssVarsProvider as CssVarsProvider, experimental_extendTheme as extendTheme} from '@mui/material/styles';
import App from "./components/App";

const theme = extendTheme({ // color pallette overwritten in css
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
    <CssVarsProvider theme={theme}>
      <App />
    </CssVarsProvider>
  );
} else {
  console.error("root not found");
}


