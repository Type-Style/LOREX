import React, { useState, useContext, useRef, useCallback, Suspense, useEffect } from 'react'
import "../css/start.css";
import { Context } from "../context";
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CheckIcon from '@mui/icons-material/Check';
import Button from '@mui/material/Button';
import ModeSwitcher from '../components/ModeSwitcher';
import { useGetData } from "../hooks/useGetData";
import { layers } from "../scripts/layers";
import { timeAgo } from "../scripts/timeAgo";


// Lazy load the components
const Status = React.lazy(() => import('../components/Status'));
const LinearBuffer = React.lazy(() => import('../components/LinearBuffer'));
const MiniMap = React.lazy(() => import('../components/MiniMap'));
const Map = React.lazy(() => import('../components/Map'));

function Start() {
  const fetchIntervalMs = 1000 * 55;
  const intervalID = useRef<NodeJS.Timeout>(null);

  const [contextObj] = useContext(Context);
  const [messageObj, setMessageObj] = useState<Omit<client.entryData, 'fetchTimeData'>>({ isError: false, status: 200, message: "" });
  const [entries, setEntries] = useState<Array<Models.IEntry>>([]);
  const [lastFetch, setLastFetch] = useState<number>();
  const [nextFetch, setNextFetch] = useState<number>();

  const { fetchData } = useGetData(entries.length, fetchIntervalMs, setEntries);
  const getData = useCallback(async () => {
    if (!contextObj.isLoggedIn) {
      if (contextObj.userInfo) { // no valid login but userInfo
        setMessageObj({ isError: true, status: 403, message: "Login expired" })
      }
      return; // no need to fetch if logged out
    }

    const { isError, status, message, fetchTimeData } = await fetchData();

    setMessageObj({ isError, status, message });

    if (fetchTimeData.last && fetchTimeData.next) {
      setLastFetch(fetchTimeData.last);
      setNextFetch(fetchTimeData.next);
    }
    

  }, [fetchData, contextObj.isLoggedIn, contextObj.userInfo]);

  getData();
  
  useEffect(() => {
    if (!intervalID.current) { // Setup Interval to fetch data
      intervalID.current = setInterval(getData, fetchIntervalMs); // capture interval ID as return from setInterval
    }

    if (messageObj.isError && messageObj.status == 403 && intervalID.current) { // clear interval when logged out
      clearInterval(intervalID.current); intervalID.current = null;
    }
  
    return () => {
      if (intervalID.current) {
        clearInterval(intervalID.current); intervalID.current = null;
      }
    }
  }, [fetchIntervalMs, messageObj.isError, messageObj.status, getData]);
 

  

 
  return (
    <>
      <div className="start">
        <div className="grid-item info">
          {messageObj.isError &&
            <div className="message center error">
              <strong className="title">{messageObj.status}</strong> <span className="fadeIn">{messageObj.message}</span>
            </div>
          }
          {!messageObj.isError && contextObj.userInfo && typeof contextObj.userInfo == "object" &&
            <div className="message">
              <strong className="title">{contextObj.userInfo.user}</strong> <span className="fade">Welcome back</span>
            </div>
          }
          <Button
            className={`loginButton ${contextObj.isLoggedIn ? "loginButton--loggedIn" : ''} cut`}
            variant="contained"
            href={contextObj.isLoggedIn ? undefined : "/login"}
            onClick={contextObj.isLoggedIn ? () => { contextObj.setLogin(false); localStorage.clear(); } : undefined}
            endIcon={contextObj.isLoggedIn ? <CheckIcon /> : null}
            startIcon={contextObj.isLoggedIn ? null : <HighlightOffIcon />}
            color={contextObj.isLoggedIn ? "success" : "error"}
            size="large"
          >
            {contextObj.isLoggedIn ? "Logged In" : "Logged Out"}
          </Button>
        </div>

        <div className="grid-item map cut">
          <Suspense fallback={<div>Loading Map...</div>}>
            <Map entries={entries} />
          </Suspense>
        </div>

        <div className="grid-item theme"><ModeSwitcher /></div>

        {contextObj.isLoggedIn && (
          <div className={`grid-item status ${entries.length ? "cut-after" : 'emptyData'}`}>
            <Suspense fallback={<div>Loading Status...</div>}>
              <Status entries={entries} />
            </Suspense>
          </div>
        )}

        {contextObj.isLoggedIn && (<div className="grid-item images">
          {entries.at(-1) && layers.map((layer, index) => {
            return (
              <Suspense fallback={<div>Loading MiniMap...</div>} key={index}>
                <MiniMap layer={layer} index={index} lastEntry={entries[entries.length - 1]} />
              </Suspense>
            )
          })}
        </div>)}

        <div className="grid-item subinfo">
          {contextObj.isLoggedIn && intervalID && lastFetch && nextFetch &&
            <Suspense fallback={<div>Loading Progress...</div>}>
              <LinearBuffer msStart={lastFetch} msFinish={nextFetch} variant="determinate" />
            </Suspense>
          }

          {entries?.length > 0 &&
            <>
              <strong className="info noDivider">GPS:</strong>
              <span className="info">{entries.at(-1)!.lat} / {entries.at(-1)!.lon}</span>
              <span className="info">{contextObj.isLoggedIn ? timeAgo(entries.at(-1)!.time.created) : entries.at(-1)!.time.createdString}</span>
            </>
          }
        </div>
      </div>
      <svg className="bg-pattern" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="url(#repeatingGradient)" />
      </svg>
    </>
  )
}

export default Start