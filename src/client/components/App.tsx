import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Contacts from './Contacts';
import "./css/app.css";

import Provider from "./context"

const App = () => {
  return (
    <Provider>
      <div className="app">
        <Router>
          <Routes>
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/" element={
              <>
                <h1 className="headline">Hello, React! <br /> 
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
