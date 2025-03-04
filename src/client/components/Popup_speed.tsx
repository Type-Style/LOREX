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
      {entry.speed.vertical && (
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
