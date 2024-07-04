import React, { useEffect, useState, useContext } from 'react'
import "../css/start.css";
import axios from 'axios';
import { LoginContext } from "../components/App";
import { HighlightOff, Check } from '@mui/icons-material';
import { Button } from '@mui/material';
import ModeSwitcher from '../components/ModeSwitcher';
import Map from '../components/Map';

function Start() {
  const [isLoggedIn, setLogin] = useContext(LoginContext);
  const [entries, setEntries] = useState<Models.IEntry[]>([]);
  const [errorObj, setMessageObj] = React.useState({ isError: null, status: null, message: null });


  useEffect(() => {
    const token = sessionStorage.getItem("jwt");
    let response;

    const getData = async () => {
      if (!token) {
        setLogin(false);
        setMessageObj({ isError: true, status: "403", message: "No token / logged out" })
        return false;
      }

      try {
        response = await axios({
          method: 'get',
          url: "/read?index=0",
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setEntries(response.data.entries);
        setMessageObj({ isError: null, status: null, message: null });
      } catch (error) {
        setMessageObj({ isError: true, status: error.response.data.status || error.response.status, message: error.response.data.message || error.message });
      }
    };

    getData();
    console.log(response);

    return () => {
      console.log("cleanup")
    };

  }, []);

  return (
    <div className="start">
      <div className="grid-item info">
        {errorObj.isError &&
          <div className="error">
            <strong className="statusCode">{errorObj.status}</strong> <span>{errorObj.message} </span>
          </div>
        }
        <Button
          className={`loginButton ${isLoggedIn ? "loginButton--loggedIn" : ''} cut`}
          variant="contained"
          href={isLoggedIn ? null : "/login"}
          onClick={isLoggedIn ? () => { setLogin(false); sessionStorage.clear(); } : null}
          endIcon={isLoggedIn ? <Check /> : null}
          startIcon={isLoggedIn ? null : <HighlightOff />}
          color={isLoggedIn ? "success" : "error"}
          size="large"
        >
          {isLoggedIn ? "Logged In" : "Logged Out"}
        </Button>
      </div>

      <div className="grid-item map"><Map entries={entries}/></div>
      <div className="grid-item theme"><ModeSwitcher/></div>
      <div className="grid-item status">status</div>
      <div className="grid-item images">
        <div className="image">image1</div>
        <div className="image">image2</div>
      </div>

      <div className="grid-item subinfo">subinfo</div>
    </div>
  )
}

export default Start