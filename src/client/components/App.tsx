import React, { Component } from 'react';
import Contact from './Contact';
import  * as css from"./css/app.module.css";

class App extends Component {
  render() {
    return (
      <div className={css.app}>
        <h1 className={css.headline}>Hello, React!</h1>
        <Contact name="Joe Doe" email='jd@gmail.com' phone='0123456789'/>
      </div>
    );
  }
}


export default App;