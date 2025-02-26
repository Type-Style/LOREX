import React from 'react'
import { getDistance } from "../scripts/getDistance"

export default function PopupDistance({ entry, cleanEntries }: { entry: Models.IEntry, cleanEntries: Models.IEntry[] }) {
  return (
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
  )
}
