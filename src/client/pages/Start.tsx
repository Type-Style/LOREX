import React, { useState, useContext, useRef, useCallback, Suspense, useEffect, lazy } from 'react'
import { Context } from "../context";
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CheckIcon from '@mui/icons-material/Check';
import Button from '@mui/material/Button';
import ModeSwitcher from '../components/ModeSwitcher';
import { useGetData } from "../hooks/useGetData";
import { layers } from "../scripts/layers";
import { timeAgo } from "../scripts/timeAgo";
import "../css/start.css";
import CircularProgress from "@mui/material/CircularProgress";
import { Message } from "../components/Message";


// Lazy load the components
const Status = lazy(() => import('../components/Status'));
const LinearBuffer = lazy(() => import('../components/LinearBuffer'));
const MiniMap = lazy(() => import('../components/MiniMap'));
const Map = lazy(() => import('../components/Map'));

const fetchIntervalMs = 1000 * 55;

function Start() {
  const [isFirstRender, setFirstRender] = useState<boolean>(true);
  const intervalID = useRef<NodeJS.Timeout>(null);

  const [contextObj] = useContext(Context);
  const [messageObj, setMessageObj] = useState<Omit<client.entryData, 'fetchTimeData'>>({ isError: false, status: 200, message: "" });
  const [entries, setEntries] = useState<Array<Models.IEntry>>([]);
  const [fetchTimes, setFetchTimes] = useState<{ last: number | undefined, next: number | undefined }>({ last: undefined, next: undefined });

  const { fetchData } = useGetData(entries.length, fetchIntervalMs, setEntries);
  const getData = useCallback(async () => {
    if (!contextObj.isLoggedIn) {
      setMessageObj({ isError: true, status: 403, message: contextObj.userInfo ? "Login expired" : "No valid login" });
      return; // no need to fetch if logged out
    }

    const { isError, status, message, fetchTimeData } = await fetchData();

    setMessageObj({ isError, status, message });

    if (fetchTimeData.last && fetchTimeData.next) {
      setFetchTimes({ last: fetchTimeData.last, next: fetchTimeData.next });
    }

  }, [fetchData, contextObj.isLoggedIn, contextObj.userInfo]);

  if (isFirstRender) {
    setFirstRender(false)
    getData();
  }

  useEffect(() => {
    if (!intervalID.current) { // Setup Interval to fetch data
      intervalID.current = setInterval(getData, fetchIntervalMs); // capture interval ID as return from setInterval
    }

    if (messageObj.isError && intervalID.current && (messageObj.status == 403 || messageObj.status == 401)) { // clear interval when logged out
      clearInterval(intervalID.current); intervalID.current = null;
    }

    return () => {
      if (intervalID.current) {
        clearInterval(intervalID.current); intervalID.current = null;
      }
    }
  }, [messageObj.isError, messageObj.status, getData]);



  return (
    <>
      <div className="start">
        <div className="grid-item info">
          <Message messageObj={messageObj} page="start" />

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
          {entries.length > 0 &&
            <Suspense fallback={<div className="loading box cut"><CircularProgress color="inherit" /></div>}>
              <Map entries={entries} />
            </Suspense>
          }
        </div>

        <div className="grid-item theme"><ModeSwitcher /></div>

        {contextObj.isLoggedIn && entries.length > 0 ? (
          <div className={`grid-item status ${entries.length ? "cut-after" : 'emptyData'}`}>
            <Suspense fallback={<div className="loading"><CircularProgress color="inherit" /></div>}>
              <Status entries={entries} />
            </Suspense>
          </div>
        ) : (
          <span className="noData hide@mobile cut">{contextObj.isLoggedIn ? "No Data to be displayed" : "No Login"}</span>
        )}

        {contextObj.isLoggedIn && entries.length > 0 &&
          <div className="grid-item images">
            {layers.map((layer, index) => {
              return (
                <Suspense fallback={<div className="loading box cut"><CircularProgress color="inherit" /></div>} key={index}>
                  <MiniMap layer={layer} index={index} lastEntry={entries[entries.length - 1]} />
                </Suspense>
              )
            })}
          </div>
        }

        <div className="grid-item subinfo">
          {contextObj.isLoggedIn && intervalID && fetchTimes.last && fetchTimes.next &&
            <Suspense fallback={<div className="loading line"></div>}>
              <LinearBuffer msStart={fetchTimes.last} msFinish={fetchTimes.next} variant="determinate" />
            </Suspense>
          }

          {entries.length > 0 &&
            <>
              <strong className="info noDivider">GPS:</strong>
              <a href={`https://www.openstreetmap.org/?mlat=${entries.at(-1)!.lat}&mlon=${entries.at(-1)!.lon}&zoom=12&marker=${entries.at(-1)!.lat}/${entries.at(-1)!.lon}#map=13/${entries.at(-1)!.lat}/${entries.at(-1)!.lon}`} className="info">{entries.at(-1)!.lat} / {entries.at(-1)!.lon}</a>
              {entries.at(-1)!.address &&
                <span className="info">{entries.at(-1)!.address}</span>
              }
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