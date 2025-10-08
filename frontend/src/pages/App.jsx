import { Routes, Route } from "react-router-dom";
import PageNotFound from "./PageNotFound";
import AuthPage from "./AuthPage";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "./Dashboard";
import { NetworkProvider } from "../components/NetworkProvider";
import SettingsPage from "./Settings";
import { useEffect } from "react";

function App() {

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
    <Routes>
      <Route path="/login" element={<AuthPage isLogin={true} />} />
      <Route path="/" element={<AuthPage isLogin={false} />} />
      <Route
        path="/dashboard"
        element={
          <NetworkProvider>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </NetworkProvider>
        }
      />
      <Route
        path="/settings"
        element={
          <NetworkProvider>
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          </NetworkProvider>
        }
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default App;
