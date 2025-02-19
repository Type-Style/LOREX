import React, { SyntheticEvent, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SpeedIcon from '@mui/icons-material/Speed';
import EastIcon from '@mui/icons-material/East';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import Box from '@mui/material/Box';

export const PopupContent = ({ entry }: { entry: Models.IEntry }) => {
  const [value, setValue] = useState(0);

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <>
      <Tabs value={value} onChange={handleChange}>
        <Tab icon={<SpeedIcon />} label="Speed" />
        <Tab icon={<EastIcon />} label="Distance" />
        <Tab icon={<WatchLaterOutlinedIcon />} label="Time" />
      </Tabs>

      <dl className="popupList">
        {value === 0 && (
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
      </dl>

      {value === 1 && (
        <p>This is some demo content for distance.</p>
      )}

      {value === 2 && (
        <p>This is some demo content for time.</p>
      )}
    </>
  );
};