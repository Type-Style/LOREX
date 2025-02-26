import React, { SyntheticEvent, useState } from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SpeedIcon from '@mui/icons-material/Speed';
import EastIcon from '@mui/icons-material/East';
import WatchLaterOutlinedIcon from '@mui/icons-material/WatchLaterOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PopupInfo from "./Popup_info";
import PopupSpeed from "./Popup_speed";
import PopupDistance from "./Popup_distance";
import PopupTime from "./Popup_time";

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
          <PopupInfo entry={entry}/>
        )}
        {value === 1 && (
          <PopupSpeed entry={entry} />
        )}
        {value === 2 && (
          <PopupDistance entry={entry} cleanEntries={cleanEntries} />
        )}
        {value === 3 && (
          <PopupTime entry={entry} />
        )}
      </dl>
    </div>
  );
};