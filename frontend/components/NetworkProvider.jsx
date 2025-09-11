import { createContext, useState } from "react";

const NetworkContext = createContext();

const NetworkProvider = ({ children }) => {
  const [online, setOnline] = useState(true);
  const [session, setSession] = useState(true);

  return (
    <NetworkContext.Provider value={{ online, setOnline, session, setSession }}>
      {children}
    </NetworkContext.Provider>
  );
};

export { NetworkProvider, NetworkContext };
