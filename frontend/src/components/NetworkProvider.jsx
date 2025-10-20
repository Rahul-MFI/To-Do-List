import { createContext, useEffect, useState } from "react";

const NetworkContext = createContext();

const NetworkProvider = ({ children }) => {
  const [online, setOnline] = useState(true);
  const [session, setSession] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    setSoundEnabled(localStorage.getItem('soundEnabled') === 'true');
  }, []);

  return (
    <NetworkContext.Provider value={{ online, setOnline, session, setSession, soundEnabled, setSoundEnabled }}>
      {children}
    </NetworkContext.Provider>
  );
};

export { NetworkProvider, NetworkContext };
