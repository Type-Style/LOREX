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
  const opened = (entry: Models.IEntry, ref: React.RefObject<any>) => {
    if (ref.current) {
      updateUrlParams("popup", entry.index.toString());
    }
  };

  // A remounting marker has a detached ref, so its close keeps the parameter for the remounted popup.
  const closed = (entry: Models.IEntry, ref: React.RefObject<any>) => {
    // Another marker may have opened already; only remove this marker's own parameter.
    if (ref.current && getUrlParameterValue("popup", value => value) === entry.index.toString()) {
      updateUrlParams("popup");
    }
  };

  return { opened, closed, getUrlParameterValue, updateUrlParams };
};
