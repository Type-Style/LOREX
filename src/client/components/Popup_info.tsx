import React from 'react'
import { useIgnoreData } from "../hooks/useData";
import RestorePageIcon from '@mui/icons-material/RestorePage';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import Button from "@mui/material/Button";

export default function PopupInfo({ entry }: { entry: Models.IEntry }) {
  const hdopStatus = entry.hdop < 3.25 ? 'good' : entry.hdop < 6 ? 'ok' : 'bad';
  const { ignoreData, resetData } = useIgnoreData();

  return (
    <>
      <dt>Lat / Lon</dt>
      <dd>
        <a href={`https://www.openstreetmap.org/?mlat=${entry.lat}&mlon=${entry.lon}&zoom=12&marker=${entry.lat}/${entry.lon}#map=13/${entry.lat}/${entry.lon}`} className="info">
          {`${entry.lat.toFixed(4)}`} / {`${entry.lon.toFixed(4)}`}
        </a>
        {entry.address && (
          <div className="small">{entry.address}</div>
        )}
      </dd>
      <dt>Height</dt>
      <dd>{`${entry.altitude.toFixed(1)} m`}</dd>
      <dt>Precision</dt>
      <dd>
        <span className={`small hdop-status ${hdopStatus == "bad" ? "alert" : ""}`}>{entry.hdop} &#160;{hdopStatus}</span>
      </dd>

      <dt className="small">User</dt>
      <dd className="small">{entry.user}</dd>

      <dt className="small">index</dt>
      <dd className="small">
        <button className="blendIn"
          onClick={(e) => {
            e.preventDefault();
            const content = JSON.stringify(entry, null, 2)
            alert(content);
          }}
        >
          {entry.index}
        </button>
      </dd>

      <dt>ignore</dt>
      <dd className="actions">
        <Button variant="contained" size="small" className="left blendIn" startIcon={<RestorePageIcon />} onClick={() => resetData()}>
          <span className="button-label">Reset</span>
        </Button>

        <Button variant="outlined" size="small" startIcon={<SkipPreviousIcon />} onClick={() => ignoreData(entry.index, "before")}>
          <span className="button-label">Before</span>
        </Button>

        <Button variant="outlined" size="small" startIcon={<VisibilityOffIcon />} onClick={() => ignoreData(entry.index)}>
          <span className="button-label">Self</span>
        </Button>

        <Button variant="outlined" size="small" startIcon={<SkipNextIcon />} onClick={() => ignoreData(entry.index, "after")}>
          <span className="button-label">After</span>
        </Button>
      </dd>
    </>
  )
}
