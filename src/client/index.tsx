import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./components/App";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  }
]);

const container = document.getElementById('react-root');
let root: Root;
if (container) {
  root = createRoot(container);
  root.render(
    <RouterProvider router={router} />
  );
} else {
  console.error("root not found");
}


