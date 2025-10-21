import { Routes, Route } from "react-router-dom";
import PageNotFound from "./PageNotFound";
import AuthPage from "./AuthPage";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "./Dashboard";
import { NetworkProvider } from "../components/NetworkProvider";
import SettingsPage from "./Settings";
import WelcomePage from "./WelcomePage";

function App() {

  return (
    <Routes>
      <Route path="/login" element={<AuthPage isLogin={true} />} />
      <Route path="/home" element={<WelcomePage/>}/>
      <Route path="/register" element={<AuthPage isLogin={false} />} />
      <Route
        path="/"
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
            <SettingsPage />
          </NetworkProvider>
        }
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default App;
