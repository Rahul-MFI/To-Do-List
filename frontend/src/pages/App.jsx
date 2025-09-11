import { Routes, Route } from "react-router-dom";
import PageNotFound from "./PageNotFound";
import AuthPage from "./AuthPage";
import TodoApp from "./TodoApp";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "./Dashboard";
import { NetworkProvider } from "../../components/NetworkProvider";

function App() {
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

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

export default App;
