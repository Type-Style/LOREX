import React, { useEffect, useState, useContext } from 'react'
import "../css/start.css";
import axios from 'axios';
import { LoginContext } from "../components/App";
import { HighlightOff, Check } from '@mui/icons-material';
import { Button } from '@mui/material';


function Start() {
  const [isLoggedIn] = useContext(LoginContext);
  const [entries, setEntries] = useState<Models.IEntry[]>([]);

  useEffect(() => {
    const token = sessionStorage.getItem("jwt");
    let response;

    const getData = async () => {
      try {
        response = await axios({
          method: 'get',
          url: "/read?index=0",
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        setEntries(response.data.entries);
      } catch (error) {
        console.log(error)
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
        <Button
          className="cut"
          variant="contained"
          href={isLoggedIn ? null : "/login"}
          endIcon={isLoggedIn ? <Check /> : null}
          startIcon={isLoggedIn ? null : <HighlightOff />}
          color={isLoggedIn ? "success" : "error"}
          size="large"
        >
          {isLoggedIn ? "LoggedIn" : "Locked Out"}
        </Button>


        {isLoggedIn ? "yes" : "no"} info: {JSON.stringify(entries)}</div>
      <div className="grid-item map">map</div>
      <div className="grid-item status">status</div>
      <div className="grid-item image">image1</div>
      <div className="grid-item image">image2</div>
      <div className="grid-item subinfo">subinfo</div>
    </div>
  )
}

export default Start