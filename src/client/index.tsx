import * as React from 'react';
import { Root, createRoot } from 'react-dom/client';

const App = () => {
  return (
    <h1>Hello, React!</h1>
  );
};

const container = document.getElementById('root');
let root:Root;
if (container) {
  root = createRoot(container);
  root.render(<App/>);
} else {
  console.error("root not found");
}








