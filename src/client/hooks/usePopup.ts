import { useRef } from "react";

const updateUrlParams = (key: string, value?: string) => {
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

  const opened = (entry: Models.IEntry, ref: React.RefObject<any>) => {
    setTimeout(() => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    }, 150);
    if (ref.current) {
      updateUrlParams("popup", entry.index.toString());
    }
  };

  const closed = (entry: Models.IEntry, ref: React.RefObject<any>) => {
    if (ref.current) {
        timeoutIdRef.current = setTimeout(() => { // delay removal to avoid flickering upon fetching new data
          updateUrlParams("popup");
      }, 500);
    }
  };

  const updated = (value: string) => {
    updateUrlParams("tab", value);
  };

  return { opened, closed, updated, getUrlParameterValue };
};

