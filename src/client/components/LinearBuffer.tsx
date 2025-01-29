import LinearProgress from '@mui/material/LinearProgress';
import React, { useState, useRef, useEffect } from "react";

export default function LinearBuffer({ msStart, msFinish, variant = "buffer" }: { msStart: number, msFinish: number, variant?: "buffer" | "determinate" }) {
  const [progress, setProgress] = useState(0);
  const [buffer, setBuffer] = useState(10);

  const progressRef = useRef(() => { });
  useEffect(() => {
    if (!msStart || !msFinish) {
      console.log("LinearProgress did not recieve correct data")
    }
    progressRef.current = () => {
      let progressValue;
      const duration = msFinish - msStart; // duration based on input props
      const date = new Date();
      const now = date.getTime();
      const progressCalcValue = ((now - msStart) / duration) * 100;
      progressValue = progressCalcValue;
      if (variant == "buffer") {
        const secondPhase = duration == 1000;
        const bufferValue = secondPhase ? 100 : 90;
        progressValue = secondPhase ? 100 : Math.min(progressCalcValue, bufferValue);

        setBuffer(bufferValue);
      }

      setProgress(progressValue);

    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      progressRef.current();
    }, 300);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <LinearProgress variant={variant} value={progress} valueBuffer={variant == "buffer" ? buffer : undefined} />
  );
}