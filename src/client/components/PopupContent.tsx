import React, { SyntheticEvent, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SpeedIcon from '@mui/icons-material/Speed';
import EastIcon from '@mui/icons-material/East';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { getDistance } from "../scripts/getDistance";

export const PopupContent = ({ entry, cleanEntries }: { entry: Models.IEntry, cleanEntries: Models.IEntry[] }) => {
  const [value, setValue] = useState(0);

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div className="bg cut cut-after">
      <Tabs value={value} onChange={handleChange}>
        <Tab icon={<InfoOutlinedIcon />} label="Info" />
        <Tab icon={<SpeedIcon />} label="Speed" />
        <Tab icon={<EastIcon />} label="Distance" />
        <Tab icon={<WatchLaterOutlinedIcon />} label="Time" />
      </Tabs>

      <dl className="popupList">
        {value === 0 && (
          <>
            <dt>Lat / Lon</dt>
            <dd>
              <a href={`https://www.openstreetmap.org/?mlat=${entry.lat}&mlon=${entry.lon}&zoom=12&marker=${entry!.lat}/${entry!.lon}#map=13/${entry.lat}/${entry.lon}`} className="info">
                {`${entry.lat.toFixed(4)}`} / {`${entry.lon.toFixed(4)}`}
              </a>
            </dd>
            <dt>Height</dt>
            <dd>{`${entry.altitude.toFixed(1)} m`}</dd>
            <dt>Precision</dt>
            <dd>
              {entry.hdop}
              <span className="small">&#160;{entry.hdop < 3.25 ? 'good' : entry.hdop < 6 ? 'ok' : 'bad'}</span>
            </dd>
            {entry.eta && Math.round(entry.eta) > 0 && (
              <>
                <dt className="small">ETA</dt>
                <dd className="small">{entry.eta && new Date(entry.eta).toLocaleString()}</dd>
              </>
            )}
            {typeof entry.eda === "number" && Math.round(entry.eda) > 0 && (
              <>
                <dt className="small">EDA</dt>
                <dd className="small">{(entry.eda / 1000).toFixed(3)} km</dd>
              </>
            )}

            <dt className="small">User</dt>
            <dd className="small">{entry.user}</dd>
          </>
        )}
        {value === 1 && (
          <>
            <dt>GPS</dt>
            <dd>{`${(entry.speed.gps * 3.6).toFixed(1)} km/h`}</dd>
            {entry.speed.total && (
              <>
                <dt>Calculated</dt>
                <dd>{`${(entry.speed.total * 3.6).toFixed(1)} km/h`}</dd>
              </>
            )}
            {entry.speed.vertical && (
              <>
                <dt>Vertical</dt>
                <dd>{`${(entry.speed.vertical * 3.6).toFixed(1)} km/h`}</dd>
              </>
            )}
          </>
        )}
        {value === 2 && (
          <>
            {entry.distance ? (
              <>
                <dt>Separation</dt>
                <dd>{`${(entry.distance.total / 1000).toFixed(1)} km`}</dd>
                {entry.distance.horizontal && (
                  <>
                    <dt className="small">Horizontal</dt>
                    <dd className="small">{`${(entry.distance.horizontal / 1000).toFixed(1)} km`}</dd>
                  </>
                )}
                {entry.distance.vertical && (
                  <>
                    <dt className="small">Vertical</dt>
                    <dd className="small">{`${(entry.distance.vertical / 1000).toFixed(1)} km`}</dd>
                  </>
                )}
                <dt>Ongoing</dt>
                <dd>{`${getDistance(cleanEntries, cleanEntries.indexOf(entry)).toFixed(1)} km`}</dd>
              </>
            ) : (
              <dt className="small">No distance</dt>
            )}
          </>
        )}

        {value === 3 && (
          <>
            <dt>Created</dt>
            <dd style={{ whiteSpace: 'nowrap' }}>{new Date(entry.time.recieved).toLocaleTimeString("de-DE", {
              weekday: "short",
              year: "2-digit",
              month: "2-digit",
              day: "2-digit",
              hour: '2-digit',
              hour12: false,
              minute: '2-digit',
              second: '2-digit'
            })}</dd>


            <dt>Recieved</dt>
            <dd>{new Date(entry.time.recieved).toLocaleTimeString("de-DE", {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            })}</dd>

            <dt>Upload</dt>
            <dd>{entry.time.uploadDuration.toFixed(1)}s</dd>

            {entry.time.diff && entry.time.diff > 0 && (
              
              <>
                <dt>Diff</dt>
                <dd>{`${(entry.time.diff).toFixed(1)} s`}</dd>
              </>
            )}
          </>
        )}
      </dl>
    </div>
  );
};