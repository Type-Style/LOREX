import React from 'react'
import { getDistance } from "../scripts/getDistance"

export default function PopupDistance({ entry, cleanEntries }: { entry: Models.IEntry, cleanEntries: Models.IEntry[] }) {
  return (
    <>
      {entry.distance ? (
        <>
          <dt>Separation</dt>
          <dd>{`${(entry.distance.total / 1000).toFixed(2)} km`}</dd>
          {entry.distance.horizontal && (
            <>
              <dt className="small">Horizontal</dt>
              <dd className="small">{`${(entry.distance.horizontal / 1000).toFixed(2)} km`}</dd>
            </>
          )}
          {typeof entry.distance.vertical === "number" &&  entry.distance.vertical && (
            <>
              <dt className="small">Vertical</dt>
              <dd className="small">{`${(entry.distance.vertical / 1000).toFixed(1)} km`}</dd>
            </>
          )}
          {typeof entry.distance.path === "number" && (
            <>
              <dt>Path</dt>
              <dd>{(entry.distance.path / 1000).toFixed(2)} km</dd>
            </>
          )}
          
          <dt>Ongoing</dt>
          <dd>
            {`${getDistance(cleanEntries, cleanEntries.indexOf(entry)).toFixed(2)} km`}
            <div className="small">w/o Pause: {`${getDistance(cleanEntries, cleanEntries.indexOf(entry), true).toFixed(2)} km`}</div>
          </dd>

          {typeof entry.eda === "number" && Math.round(entry.eda) > 0 && (
            <>
              <dt className="small">EDA</dt>
              <dd className="small">{(entry.eda / 1000).toFixed(3)} km</dd>
            </>
          )}

        </>
      ) : (
        <dt className="small">No distance</dt>
      )}
    </>
  )
}
