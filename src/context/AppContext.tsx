import type { FC, PropsWithChildren } from "react";
import { createContext, useContext, useState } from "react";

interface IAppContext {
  darkMode: boolean;
  updateDarkMode: (isDark: boolean) => void;
}

const AppContext = createContext<IAppContext>({} as IAppContext);

const AppContextProvider: FC<PropsWithChildren> = ({ children }) => {
  const [darkMode, setDarkMode] = useState<boolean>(true);

  function updateDarkMode(isDark: boolean) {
    setDarkMode(isDark);
  }

  return (
    <AppContext.Provider
      value={{
        darkMode,
        updateDarkMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

const useAppContext = () => useContext(AppContext);

export { AppContext as default, AppContextProvider, useAppContext };
