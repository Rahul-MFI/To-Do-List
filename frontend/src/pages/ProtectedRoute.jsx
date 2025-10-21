import { useEffect, useState } from "react";
import axiosInstance from "../../middleware/axiosInstance";
import Spinner from "../components/Spinner";
import { useNetwork } from "../components/useNetwork";
import WelcomePage from "./WelcomePage";

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const { session, setSession} = useNetwork();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setSession(false);
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get("auth/verify");
        if (response.status === 200) {
          setLoading(false);
        } else {
          setSession(false);
        }
      } catch (err) {
        if (err.response) {
          setSession(false);
        }
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-screen">
        <Spinner />
      </div>
    );
  }

  return (!session ? <WelcomePage/> : children);
}

export default ProtectedRoute;
