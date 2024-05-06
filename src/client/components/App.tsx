import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Contacts from './Contacts';
import * as css from "./css/app.module.css";

import Provider from "./context"

const App = () => {
  return (
    <Provider>
      <div className={css.app}>
        <Router>
          <Routes>
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/" element={
              <>
                <h1 className={css.headline}>Hello, React! <br /> 
                <Link to="/contacts">Go to Contacts</Link></h1>                
              </>
            } />
          </Routes>
        </Router>
      </div>
    </Provider>
  );
}

export default App;
