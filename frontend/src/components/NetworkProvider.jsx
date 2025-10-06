import { createContext, useEffect, useState } from "react";

const NetworkContext = createContext();

const NetworkProvider = ({ children }) => {
  const [online, setOnline] = useState(true);
  const [session, setSession] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(() => {

        const handleMessage = (event) => {
          if (event.data?.type === "push-sound") {
              const audio = new Audio("/audio.mp3");
              audio.play().catch((err) => console.warn("Audio blocked:", err));
          }
        };

        navigator.serviceWorker.addEventListener("message", handleMessage);
        return () => {
          navigator.serviceWorker.removeEventListener("message", handleMessage);
        };
      });
    }
  }, []);

  return (
    <NetworkContext.Provider value={{ online, setOnline, session, setSession, soundEnabled, setSoundEnabled }}>
      {children}
    </NetworkContext.Provider>
  );
};

export { NetworkProvider, NetworkContext };
