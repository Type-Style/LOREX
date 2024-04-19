import React, { Component } from 'react';
import Contacts from './Contacts';
import * as css from "./css/app.module.css";

class App extends Component {
  render() {
    return (
      <div className={css.app}>
        <h1 className={css.headline}>Hello, React!</h1>
        <Contacts />
      </div>
    );
  }
}


export default App;