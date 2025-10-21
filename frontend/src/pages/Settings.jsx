import {
  ArrowLeft,
  Bell,
  BellDot,
  BellOffIcon,
  Send,
  User2Icon,
  Volume2,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../middleware/axiosInstance";
import subscribeUserToPush from "../components/subscribe";
import Spinner from "../components/Spinner";
import { useNetwork } from "../components/useNetwork";

function SettingsPage() {
  const {
    online,
    setOnline,
    session,
    setSession,
    soundEnabled,
    setSoundEnabled,
  } = useNetwork();
  const [isMuted, setIsMuted] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("default");
  const [EnableNotifications, setEnableNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotificationPermission = async () => {
      const status = Notification.permission;
      setPermissionStatus(status);
    };

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

    const fetchNotificationSubscription = async () => {
      try {
        setIsLoading(true);
        const registration = await navigator.serviceWorker.getRegistration();
        let subscription = await registration.pushManager.getSubscription();
        subscription = JSON.parse(JSON.stringify(subscription));
        const response = await axiosInstance.post("isSubscribed", {
          endpoint: subscription.endpoint,
          expirationTime: null,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        });
        if (response.data.isActive) {
          setIsMuted(response.data.isActive);
        } else {
          setIsMuted(false);
        }
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          setOnline(false);
        } else if (error.status === 401) {
          setSession(false);
        }
        setIsMuted(false);
        console.error("Error fetching notification subscription:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
    fetchNotificationPermission();
    fetchNotificationSubscription();
  }, []);

  // Listen for service worker messages to play notification sounds
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'push-sound') {
        console.log('Received push-sound message in Settings:', event.data);
        if (soundEnabled) {
          try {
            const audio = new Audio('/audio.mp3');
            audio.play().catch(error => {
              console.error('Error playing notification sound:', error);
            });
          } catch (error) {
            console.error('Error creating audio:', error);
          }
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, [soundEnabled]);

  const handleEnableNotifications = async () => {
    const status = Notification.permission;
    if (status === "granted") {
      return;
    }
    if (status === "denied") {
      setEnableNotifications(true);
      return;
    }
    setPermissionStatus(status);
    if ("Notification" in window && status !== "denied") {
      try {
        setIsLoading2(true);
        setEnableNotifications(true);
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        if (permission === "granted") {
          console.log("Notification permission granted");
          try {
            await subscribeUserToPush(setOnline, setSession);
            setIsMuted(true);
          } catch (err) {
            if (err.code === "ERR_NETWORK") {
              setOnline(false);
            } else if (err.status === 401) {
              setSession(false);
            }
            console.error("Error subscribing to push:", err);
          }
        } else {
          console.log("Notification permission denied");
        }
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          setOnline(false);
        } else if (error.status === 401) {
          setSession(false);
        }
        console.error("Error requesting notification permission:", error);
      } finally {
        setIsLoading2(false);
        setEnableNotifications(false);
      }
    }
  };

  const testNotification = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification("Test Notification", {
        body: "Test Notification",
        requireInteraction: true,
        icon: "/icon.png",
        badge: "/icon.png",
        image: "/icon.png",
      });

      if (soundEnabled) {
        const audio = new Audio('/audio.mp3');
        audio.play().catch(error => {
          console.error('Error playing notification sound:', error);
        });
      }
      console.log("✅ Test notification sent and sound message posted.");
    } catch (error) {
      console.error("❌ Error showing test notification:", error);
    }
  };

  const toggleNotifications = async () => {
    if (isMuted) {
      try {
        setIsLoading2(true);
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
        if (error.code === "ERR_NETWORK") {
          setOnline(false);
        } else if (error.status === 401) {
          setSession(false);
        }
        console.error("Error unsubscribing:", error);
      } finally {
        setIsLoading2(false);
      }
    } else {
      try {
        setIsLoading2(true);
        await subscribeUserToPush(setOnline, setSession);
        setIsMuted(true);
      } catch (err) {
        if (err.code === "ERR_NETWORK") {
          setOnline(false);
        } else if (err.status === 401) {
          setSession(false);
        }
        console.error("Error subscribing:", err);
      } finally {
        setIsLoading2(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      {isLoading ? (
        <div className="h-dvh flex flex-col justify-center items-center">
          <Spinner />
        </div>
      ) : (
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

              <div className="p-3 sm:p-6 space-y-6">
                {/* Allow Notifications */}
                <div className="flex flex-col items-start py-4 border-b border-yellow-100">
                  <div className="flex items-center justify-between space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <BellDot className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Notification status
                      </h3>
                    </div>
                  </div>
                  <div className="w-full flex justify-between items-center">
                    <p className="p-2 text-sm text-gray-600">
                      Show the status of notification permission
                    </p>
                    <span
                      className={`text-md font-medium ${
                        permissionStatus === "granted"
                          ? "text-green-600"
                          : permissionStatus === "denied"
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {permissionStatus.charAt(0).toUpperCase() +
                        permissionStatus.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Activate notification */}
                <div className="flex flex-col items-start py-4 border-b border-yellow-100">
                  <div className="flex items-center justify-between space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <BellOffIcon className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Activate notification
                      </h3>
                    </div>
                  </div>
                  <div className="w-full flex justify-between items-center">
                    <p className="p-2 text-sm text-gray-600">
                      Enable to activate the notification
                    </p>
                    {isLoading2 ? (
                      <Spinner />
                    ) : (
                      <button
                        disabled={isLoading2}
                        onClick={() => {
                          if (permissionStatus === "granted") {
                            toggleNotifications();
                          } else {
                            handleEnableNotifications();
                          }
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
                    )}
                  </div>
                </div>

                {/* Allow Sound */}
                <div className="flex flex-col items-start py-4 border-b border-yellow-100">
                  <div className="flex items-center justify-between space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Volume2 className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Sound
                      </h3>
                    </div>
                  </div>
                  <div className="w-full flex justify-between items-center">
                    <p className="p-2 text-sm text-gray-600">
                      Enable sound effects and notification sounds
                    </p>
                    <button
                      onClick={() => {
                        setSoundEnabled(!soundEnabled);
                          localStorage.setItem('soundEnabled', !soundEnabled);
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

                {/* Test Notification Sound */}
                <div className="flex flex-col items-start py-4 border-b border-yellow-100">
                  <div className="flex items-center justify-between space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Send className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Test Notification Sound
                      </h3>
                    </div>
                  </div>
                  <div className="w-full flex justify-between items-center">
                    <p className="p-2 text-sm text-gray-600">
                      Send a test notification sound by button click
                    </p>
                    <button
                      onClick={() => {
                        testNotification();
                      }}
                      className={`rounded-4xl bg-yellow-600 text-white text-md px-4 py-2 hover:bg-yellow-700`}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex text-sm w-full justify-center px-4 py-4 items-center space-x-3">
              Please allow sound and pop up navigation in your browser settings.
            </div>
          </main>
          {!session && (
            <div
              className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4 z-100"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
            >
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg shadow-lg max-w-md w-full">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-yellow-200 p-3 rounded-full">
                      <User2Icon className="w-8 h-8 text-yellow-700" />
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
                    Session Expired
                  </h2>

                  <p className="text-gray-600 text-center text-sm leading-relaxed">
                    Your session has been expired. Please try to login or create
                    a new account.
                  </p>
                </div>

                <div className="px-6 pb-6">
                  <button
                    onClick={() => {
                      setSession(true);
                      localStorage.removeItem("token");
                      localStorage.removeItem("wid");
                      navigate("/", { replace: true });
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 xl:py-3 xl:px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-semibold"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {!online && (
            <div
              className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4 z-100"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
            >
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg shadow-lg max-w-md w-full">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-yellow-200 p-3 rounded-full">
                      <WifiOff className="w-8 h-8 text-yellow-700" />
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
                    No Internet Connection
                  </h2>

                  <p className="text-gray-600 text-center text-sm leading-relaxed">
                    Please check your network connection and try again. Make
                    sure you're connected to Wi-Fi or mobile data.
                  </p>
                </div>

                <div className="px-6 pb-6">
                  <button
                    onClick={() => {
                      setOnline(true);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 xl:py-3 xl:px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-semibold"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          {EnableNotifications && (
            <div
              className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4 z-100"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
            >
              <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg shadow-lg max-w-md w-full">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-yellow-200 p-3 rounded-full">
                      <Bell className="w-8 h-8 text-yellow-700" />
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
                    Allow Notifications
                  </h2>

                  <p className="text-gray-600 text-center text-sm leading-relaxed">
                    Please allow notification permission in your browser
                    settings to receive notifications.
                  </p>
                </div>
                <div className="px-6 pb-6">
                  <button
                    onClick={() => {
                      setEnableNotifications(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 xl:py-3 xl:px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 font-semibold"
                  >
                    Ok, Got it
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
