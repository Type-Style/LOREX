import React, { SyntheticEvent, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SpeedIcon from '@mui/icons-material/Speed';
import EastIcon from '@mui/icons-material/East';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import Box from '@mui/material/Box';

export const PopupContent = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Tabs value={value} onChange={handleChange}>
        <Tab icon={<SpeedIcon />} label="Speed" />
        <Tab icon={<EastIcon />} label="Distance" />
        <Tab icon={<WatchLaterOutlinedIcon />} label="Time" />
      </Tabs>

      {value === 0 && (
        <Box sx={{ padding: 2 }}>
          <h2>Speed</h2>
          <p>This is some demo content for speed.</p>
        </Box>
      )}

      {value === 1 && (
        <Box sx={{ padding: 2 }}>
          <h2>Distance</h2>
          <p>This is some demo content for distance.</p>
        </Box>
      )}

      {value === 2 && (
        <Box sx={{ padding: 2 }}>
          <h2>Time</h2>
          <p>This is some demo content for time.</p>
        </Box>
      )}
    </Box>
  );
};