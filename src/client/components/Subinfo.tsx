import React, { lazy, Suspense } from 'react';
import { timeAgo } from '../scripts/timeAgo';

const LinearBuffer = lazy(() => import('./LinearBuffer'));

export default function Subinfo({ entries, isLoggedIn, fetchTimes }: {
  entries: Array<Models.IEntry>,
  isLoggedIn: boolean,
  fetchTimes: { last: number | undefined, next: number | undefined }
}) {
  const lastEntry = entries.at(-1);

  return (
    <>
      {isLoggedIn && fetchTimes.last && fetchTimes.next &&
        <Suspense fallback={<div className="loading line"></div>}>
          <LinearBuffer msStart={fetchTimes.last} msFinish={fetchTimes.next} variant="determinate" />
        </Suspense>
      }

      {lastEntry &&
        <>
          <strong className="info noDivider">GPS:</strong>
          <a href={`https://www.openstreetmap.org/?mlat=${lastEntry.lat}&mlon=${lastEntry.lon}&zoom=12&marker=${lastEntry.lat}/${lastEntry.lon}#map=13/${lastEntry.lat}/${lastEntry.lon}`} className="info">{lastEntry.lat} / {lastEntry.lon}</a>
          {lastEntry.address &&
            <span className="info">{lastEntry.address}</span>
          }
          <span className="info">{isLoggedIn ? timeAgo(lastEntry.time.created) : lastEntry.time.createdString}</span>
        </>
      }
    </>
  );
}
