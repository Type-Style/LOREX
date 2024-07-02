import * as React from 'react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';

export default function LinearBuffer({ msStart, msFinish }: { msStart: number, msFinish: number }) {
  const [progress, setProgress] = React.useState(0);
  const [buffer, setBuffer] = React.useState(10);

  const progressRef = React.useRef(() => { });
  React.useEffect(() => {
    progressRef.current = () => { 
      const duration = msFinish - msStart; // duration based on input props
      const secondPhase = duration == 1000;
      const date = new Date();
      const now = date.getTime();
     
      const bufferValue = secondPhase ? 100 : 90;
      const progressCalcValue = ((now - msStart) / duration) * 100;
      const progressValue = secondPhase ? 100 : Math.min(progressCalcValue, bufferValue);

      setProgress(progressValue);
      setBuffer(bufferValue);
    };
  });

  React.useEffect(() => {
    const timer = setInterval(() => {
      progressRef.current();
    }, 300);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <LinearProgress variant="buffer" value={progress} valueBuffer={buffer} />
    </Box>
  );
}