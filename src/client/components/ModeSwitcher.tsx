import React, { useContext} from 'react';
import { Context } from "../components/App";
import { Button } from '@mui/material';
import { LightMode, Nightlight } from '@mui/icons-material';
import * as css from "../css/modeSwticher.module.css";

function ModeSwitcher() {
  const [, , , , mode, setMode] = useContext(Context);

   return (
    <Button
      className={css.modeSwitcher}
      variant='outlined' size='large'
      startIcon={mode === 'dark' ? <Nightlight /> : <LightMode />}
      onClick={() => {
        if (mode === 'light') {
          setMode('dark');
        } else {
          setMode('light');
        }
      }}
    >
      {mode} {/* is empty but why? */}
    </Button>
  );
}


export default ModeSwitcher;
