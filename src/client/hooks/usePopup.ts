import { useEffect, useRef } from "react";

const updateUrlParams = (key: string, value?: string | null) => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
  
  url.search = params.toString();
  window.history.replaceState({}, '', url.toString());
};

const getUrlParameterValue = <T>(key: string, validation: (value: string) => T | null): T | null => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  const value = params.get(key);
  return value ? validation(value) : null;
};

export const usePopup = () => {
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => () => {
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  const opened = (entry: Models.IEntry, ref: React.RefObject<any>) => {
    if (timeoutIdRef.current !== null) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    if (ref.current) {
      updateUrlParams("popup", entry.index.toString());
    }
  };

  const closed = (entry: Models.IEntry, ref: React.RefObject<any>) => {
    if (ref.current) {
      if (timeoutIdRef.current !== null) {
        clearTimeout(timeoutIdRef.current);
      }
      timeoutIdRef.current = setTimeout(() => { // delay removal to avoid flickering upon fetching new data
        timeoutIdRef.current = null;
        // Another marker has its own hook and may have opened during the delay.
        if (getUrlParameterValue("popup", value => value) === entry.index.toString()) {
          updateUrlParams("popup");
        }
      }, 500);
    }
  };


  return { opened, closed, getUrlParameterValue, updateUrlParams };
};

