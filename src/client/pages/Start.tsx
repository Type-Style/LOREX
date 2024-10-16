import React, { useState, useContext, useRef, useCallback, Suspense } from 'react'
import "../css/start.css";
import { Context } from "../components/App";
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CheckIcon from '@mui/icons-material/Check';
import Button from '@mui/material/Button';
import ModeSwitcher from '../components/ModeSwitcher';
import { useGetData } from "../scripts/getData";
import { layers } from "../scripts/layers";

// Lazy load the components
const Status = React.lazy(() => import('../components/Status'));
const LinearBuffer = React.lazy(() => import('../components/LinearBuffer'));
const MiniMap = React.lazy(() => import('../components/MiniMap'));
const Map = React.lazy(() => import('../components/Map'));

function timeAgo(timestamp: number): string {
  if (!Number.isInteger(timestamp)) {
    return "";
  }
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  const seconds = diffInSeconds;
  const minutes = Math.round(diffInSeconds / 60);
  const hours = Math.round(diffInSeconds / 3600);
  const days = Math.round(diffInSeconds / 86400);
  const months = Math.round(diffInSeconds / 2592000);
  const years = Math.round(diffInSeconds / 31536000);

  if (seconds < 8) return "Instant";
  else if (seconds < 25) return "Just now";
  else if (seconds < 50) return "a moment ago";
  else if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  else if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  else if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  else if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
  else return `${years} ${years === 1 ? "year" : "years"} ago`;

}

function Start() {
  const fetchIntervalMs = 1000 * 55;
  const index = useRef(0); // used to hold information on how many entries, for looping and refetching second to last entry (ignore check)
  const initialRender = useRef(true);
  const intervalID = useRef<NodeJS.Timeout>();

  const [contextObj] = useContext(Context);
  const [messageObj, setMessageObj] = useState({ isError: null, status: null, message: null });
  const [entries, setEntries] = useState<Models.IEntry[] | null>([]);
  const [lastFetch, setLastFetch] = useState<number>();
  const [nextFetch, setNextFetch] = useState<number>();

  const { fetchData } = useGetData(index, fetchIntervalMs, setEntries);
  const getData = useCallback(async () => {
    initialRender.current = false;
    if (!contextObj.isLoggedIn) {
      if (contextObj.userInfo) { // no valid login but userInfo
        setMessageObj({ isError: true, status: "403", message: "Login expired" })
      }
      return; // no need to fetch if logged out
    }

    const { isError, status, message, fetchTimeData } = await fetchData();

    setMessageObj({ isError, status, message });

    if (isError && status == 403) {
      clearInterval(intervalID.current); intervalID.current = null;
    }

    if (fetchTimeData.last && fetchTimeData.next) {
      setLastFetch(fetchTimeData.last);
      setNextFetch(fetchTimeData.next);
    }

    if (typeof intervalID.current == "undefined") { // deliberately checking for undefined, to compare initial state vs set to null on errors
      intervalID.current = setInterval(getData, fetchIntervalMs); // capture interval ID as return from setInterval
    }

    initialRender.current = false;
  }, [fetchData]);

  if (initialRender.current) {
    getData();
  }

  return (
    <>
      <div className="start">
        <div className="grid-item info">
          {messageObj.isError &&
            <div className="message center error">
              <strong className="title">{messageObj.status}</strong> <span className="fadeIn">{messageObj.message}</span>
            </div>
          }
          {!messageObj.isError && contextObj.userInfo &&
            <div className="message">
              <strong className="title">{contextObj.userInfo.user}</strong> <span className="fade">Welcome back</span>
            </div>
          }
          <Button
            className={`loginButton ${contextObj.isLoggedIn ? "loginButton--loggedIn" : ''} cut`}
            variant="contained"
            href={contextObj.isLoggedIn ? null : "/login"}
            onClick={contextObj.isLoggedIn ? () => { contextObj.setLogin(false); localStorage.clear(); } : null}
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
                <MiniMap layer={layer} index={index} lastEntry={entries.at(-1)} />
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
              <span className="info">{entries.at(-1).lat} / {entries.at(-1).lon}</span>
              <span className="info">{timeAgo(entries.at(-1).time.created)}</span>
            </>
          }
        </div>
      </div >
      <svg className="bg-pattern" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="url(#repeatingGradient)" />
      </svg>
    </>
  )
}

export default Start