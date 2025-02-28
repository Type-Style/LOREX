import React from 'react'

export default function PopupInfo({ entry }: { entry: Models.IEntry }) {
  return (
    <>
      <dt>Lat / Lon</dt>
      <dd>
        <a href={`https://www.openstreetmap.org/?mlat=${entry.lat}&mlon=${entry.lon}&zoom=12&marker=${entry!.lat}/${entry!.lon}#map=13/${entry.lat}/${entry.lon}`} className="info">
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
  )
}
