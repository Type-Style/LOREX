import React, { Component } from 'react';
import  * as css from"./css/app.module.css";

class App extends Component {
  render() {
    return (
      <div className={css.app}>
        <h1 className={css.headline}>Hello, React!</h1>
      </div>
    );
  }
}


export default App;