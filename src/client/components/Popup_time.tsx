import React from 'react'

export default function PopupTime({ entry }: { entry: Models.IEntry }) {
  return (
    <>
      <dt>Created</dt>
      <dd style={{ whiteSpace: 'nowrap' }}>{new Date(entry.time.created).toLocaleTimeString("de-DE", {
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

      {typeof entry.eta === "number" && Math.round(entry.eta) > 0 && (
        <>
          <dt className="small">ETA</dt>
          <dd className="small">{entry.eta && new Date(entry.eta).toLocaleString()}</dd>
        </>
      )}

      {typeof entry.time.path === "number" && (
        <>
          <dt className="small">Path Time</dt>
          <dd className="small">{entry.time.path}s</dd>
        </>
      )}
    </>
  )
}
