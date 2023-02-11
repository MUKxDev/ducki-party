import type { FC, PropsWithChildren } from "react";
import { createContext, useContext, useState } from "react";

interface IAppContext {
  darkMode: boolean;
  updateDarkMode: (isDark: boolean) => void;
  fullscreen?: boolean;
  updateFullscreen: (isDark: boolean) => void;
}

const AppContext = createContext<IAppContext>({} as IAppContext);

const AppContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [fullscreen, setFullscreen] = useState<boolean>(false);

  function updateDarkMode(isDark: boolean) {
    setDarkMode(isDark);
  }
  function updateFullscreen(isFullscreen: boolean) {
    setFullscreen(isFullscreen);
  }

  return (
    <AppContext.Provider
      value={{
        darkMode,
        updateDarkMode,
        fullscreen,
        updateFullscreen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

const useAppContext = () => useContext(AppContext);

export { AppContext as default, AppContextProvider, useAppContext };
