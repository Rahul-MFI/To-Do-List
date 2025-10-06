import { ArrowLeft, Bell, BellDot, BellOffIcon, Navigation, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../middleware/axiosInstance";
import subscribeUserToPush from "../components/subscribe";
import Spinner from "../components/Spinner";
import { useNetwork } from "../components/useNetwork";

function SettingsPage() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("default");
  const { soundEnabled, setSoundEnabled } = useNetwork();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotificationActivation = async () => {

    }
    const handleEnableNotifications = async () => {
      const status = Notification.permission;
      setPermissionStatus(status);
      setIsEnabled(status === "granted");
      if ("Notification" in window && status !== "denied") {
        try {
          const permission = await Notification.requestPermission();
          setPermissionStatus(permission);
          if (permission === "granted") {
            setIsEnabled(true);
            console.log("Notification permission granted");
            subscribeUserToPush();
            new Notification("Notifications Enabled!", {
              body: "You will now receive notifications from this site.",
              icon: "🔔",
            });
          } else {
            setIsEnabled(false);
            console.log("Notification permission denied");
          }
        } catch (error) {
          console.error("Error requesting notification permission:", error);
        }
      }
    };
    handleEnableNotifications();
    fetchNotificationActivation();
  }, []);

  const toggleNotifications = async () => {
    setIsLoading(true);
    if (isMuted) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        let subscription = await registration.pushManager.getSubscription();
        subscription = JSON.parse(JSON.stringify(subscription));
        await axiosInstance.post("unsubscribe", {
          endpoint: subscription.endpoint,
          expirationTime: null,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        });
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker
            .getRegistration("/sw.js")
            .then((registration) => {
              if (registration) {
                registration.unregister().then((success) => {
                  console.log(
                    success
                      ? "Service worker unregistered"
                      : "Failed to unregister"
                  );
                });
              } else {
                console.log("No service worker found for this scope.");
              }
            });
        }
        setIsMuted(false);
      } catch (error) {
        console.error("Error unsubscribing:", error);
      }
    } else {
      try {
        await subscribeUserToPush();
        setIsMuted(true);
      } catch (error) {
        console.error("Error subscribing:", error);
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-yellow-50">
      <header className="shadow-sm bg-yellow-500">
        <div className=" mx-auto px-4 py-3 md:px-6">
          <div className="flex">
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  navigate("/dashboard");
                }}
                className="text-white hover:text-yellow-800 font-medium"
              >
                <ArrowLeft className="w-6 h-6 text-xl text-white" />
              </button>
              <h1 className="text-xl xl:text-2xl font-bold text-white">
                Settings
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="lg:max-w-3/4 mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-yellow-200">
          <div className="p-6 border-b border-yellow-100">
            <h2 className="text-2xl font-semibold text-gray-900">
              Preferences
            </h2>
            <p className="text-gray-600 mt-1">
              Manage your app settings and preferences
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Allow Notifications */}
            <div className="flex items-center justify-between py-4 border-b border-yellow-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <BellDot className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Notification status
                  </h3>
                  <p className="text-sm text-gray-600">
                    Show the status of notification permission
                  </p>
                </div>
              </div>
              {isLoading ? (
                <Spinner />
              ) : (
                <button
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                    isEnabled ? "bg-yellow-500" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between py-4 border-b border-yellow-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <BellOffIcon className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Activate notification 
                  </h3>
                  <p className="text-sm text-gray-600">
                    Enable to activate the notification
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  toggleNotifications();
                }}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                  isMuted ? "bg-yellow-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isMuted ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Allow Sound */}
            <div className="flex items-center justify-between py-4 border-b border-yellow-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Volume2 className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Sound 
                  </h3>
                  <p className="text-sm text-gray-600">
                    Enable sound effects and notification sounds
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSoundEnabled(!soundEnabled);
                }}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                  soundEnabled ? "bg-yellow-500" : "bg-gray-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    soundEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
        <div className="flex w-full justify-center py-4 items-center space-x-3">
          Please allow sound and pop up navigation in your browser settings.
        </div>
      </main>
    </div>
  );
}

export default SettingsPage;
