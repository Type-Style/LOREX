import React, { SyntheticEvent, useEffect, useState } from 'react';
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
import { usePopup } from "../hooks/usePopup";

const tabs = [
  { name: "info", icon: <InfoOutlinedIcon /> },
  { name: "speed", icon: <SpeedIcon /> },
  { name: "distance", icon: <EastIcon /> },
  { name: "time", icon: <WatchLaterOutlinedIcon /> },
];

export const PopupContent = ({ entry, cleanEntries }: { entry: Models.IEntry, cleanEntries: Models.IEntry[] }) => {
  const [value, setValue] = useState(0);
  const { updated, getUrlParameterValue } = usePopup();


  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
    updated(tabs[newValue].name);
  };

  useEffect(() => { // initial value
    let tabValue = getUrlParameterValue<string>("popup", (value) => {
      const parsedValue = parseInt(value, 10);
      return isNaN(parsedValue) ? null : parsedValue.toString();
    });

    if (!tabValue) {
      tabValue = tabs[0].name;
      updated(tabs[0].name);
    }
    const newValue = Math.max(tabs.findIndex(tab => tab.name === tabValue), 0);
    setValue(newValue);
  }, []);

  return (
    <div className="bg cut cut-after">
      <Tabs value={value} onChange={handleChange}>
        {tabs.map((tab, index) => (
          <Tab key={index} icon={tab.icon} label={tab.name} />
        ))}
      </Tabs>

      <dl className="popupList">
        {tabs.map((tab, index) => (
          index === value && (
            <React.Fragment key={index}>
              {tab.name === "info" && (
                <PopupInfo entry={entry} />
              )}
              {tab.name === "speed" && (
                <PopupSpeed entry={entry} />
              )}
              {tab.name === "distance" && (
                <PopupDistance entry={entry} cleanEntries={cleanEntries} />
              )}
              {tab.name === "time" && (
                <PopupTime entry={entry} />
              )}
            </React.Fragment>
          )
        ))}
      </dl>
    </div>
  );
};