import React, { useContext } from 'react';
import { Context } from "../context";
import Button from '@mui/material/Button';
import LightModeIcon from '@mui/icons-material/LightMode';
import NightlightIcon from '@mui/icons-material/Nightlight';

import * as css from "../css/modeSwticher.module.css";

function ModeSwitcher() {
  const [contextObj] = useContext(Context);

  return (
    <Button
      className={css.modeSwitcher}
      variant='outlined' size='large'
      startIcon={contextObj.mode === 'dark' ? <NightlightIcon /> : <LightModeIcon />}
      onClick={() => {
        contextObj.setMode(contextObj.mode === 'light' ? 'dark' : 'light');
      }}
    >
      {contextObj.mode}
    </Button>
  );
}


export default ModeSwitcher;
