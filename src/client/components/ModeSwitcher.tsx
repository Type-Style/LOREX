import React, { useContext } from 'react';
import { Context } from "../components/App";
import { Button } from '@mui/material';
import { LightMode, Nightlight } from '@mui/icons-material';
import * as css from "../css/modeSwticher.module.css";

function ModeSwitcher() {
  const [contextObj] = useContext(Context);

  return (
    <Button
      className={css.modeSwitcher}
      variant='outlined' size='large'
      startIcon={contextObj.mode === 'dark' ? <Nightlight /> : <LightMode />}
      onClick={() => {
        if (contextObj.mode === 'light') {
          contextObj.setMode('dark');
        } else {
          contextObj.setMode('light');
        }
      }}
    >
      {contextObj.mode} {/* is empty but why? */}
    </Button>
  );
}


export default ModeSwitcher;
