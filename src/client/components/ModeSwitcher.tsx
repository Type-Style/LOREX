import React from 'react';
import { useColorScheme } from '@mui/material/styles';
import { Button, useMediaQuery } from '@mui/material';
import { LightMode, Nightlight } from '@mui/icons-material';

function ModeSwitcher() {
  const { mode, setMode } = useColorScheme();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  // run only once
  React.useEffect(() => {
    setMode(prefersDarkMode ? "dark" : "light");
  }, []);

  return (
    <Button
      variant='contained' size='large'
      startIcon={mode === 'dark' ? <Nightlight/> : <LightMode/>}
      onClick={() => {
        if (mode === 'light') {
          setMode('dark');
        } else {
          setMode('light');
        }
      }}
    >
      {mode}
    </Button>
  );
};


export default ModeSwitcher;
