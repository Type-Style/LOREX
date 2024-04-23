import React, { Component } from 'react';
import Contacts from './Contacts';
import * as css from "./css/app.module.css";

import Provider from "./context"

class App extends Component {
  render() {
    return (
      <Provider>
        <div className={css.app}>
          <h1 className={css.headline}>Hello, React!</h1>
          <Contacts />
        </div>
      </Provider>
    );
  }
}


export default App;