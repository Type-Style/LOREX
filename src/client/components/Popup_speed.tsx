import React from 'react'
import { exceed } from "../scripts/maxSpeed"

export default function PopupSpeed({ entry }: { entry: Models.IEntry }) {
  return (
    <>
      <dt>GPS</dt>
      <dd>{`${(entry.speed.gps * 3.6).toFixed(1)} km/h`}</dd>
      {entry.speed.total && (
        <>
          <dt>Calculated</dt>
          <dd>{`${(entry.speed.total * 3.6).toFixed(1)} km/h`}</dd>
        </>
      )}
      {typeof entry.speed.path === "number" && (
        <>
          <dt className="small">Path</dt>
          <dd className="small">{`${(entry.speed.path * 3.6).toFixed(1)} km/h`}</dd>
        </>
      )}
      {entry.speed.vertical != null && (
        <>
          <dt>Vertical</dt>
          <dd>{`${(entry.speed.vertical * 3.6).toFixed(1)} km/h`}</dd>
        </>
      )}
      
      {entry.speed.maxSpeed && (
        <>
          <dt>MaxSpeed</dt>
          <dd><span className={exceed(entry) ? "alert" : ""}>{`${(entry.speed.maxSpeed).toFixed(1)} km/h`}</span></dd>
        </>
      )}
    </>
  )
}
