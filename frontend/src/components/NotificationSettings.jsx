// import { useState, useEffect } from 'react';

// const NotificationSettings = () => {
//   const [isSupported, setIsSupported] = useState(true);
//   const [permission, setPermission] = useState('default');
//   const [isSubscribed, setIsSubscribed] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [status, setStatus] = useState('');
//   const [registration, setRegistration] = useState(null);

//   const VITE_VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

//   useEffect(() => {
//     if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
//       return;
//     }

//     const init = async () => {
//       try {
//         const reg = await navigator.serviceWorker.register('/service-worker.js');
//         setRegistration(reg);

//         setPermission(Notification.permission);

//         // Check if user is already subscribed
//         const subscription = await reg.pushManager.getSubscription();
//         setIsSubscribed(!!subscription);
//       } catch (err) {
//         console.error('Service Worker registration failed:', err);
//         setIsSupported(false);
//       }
//     };

//     init();
//   }, []);

//   const handleEnableNotifications = async () => {
//     if (!registration) return;

//     setIsLoading(true);
//     setStatus('Requesting permission...');

//     try {
//       const granted = await Notification.requestPermission();
//       setPermission(granted);

//       if (granted !== 'granted') {
//         setStatus('Permission denied. Please enable notifications in your browser settings.');
//         setIsLoading(false);
//         return;
//       }

//       setStatus('Subscribing to notifications...');
//       const subscription = await registration.pushManager.subscribe({
//         userVisibleOnly: true,
//         applicationServerKey: urlBase64ToUint8Array(VITE_VAPID_PUBLIC_KEY),
//       });

//       console.log('Push subscription:', subscription);
//       setIsSubscribed(true);
//       setStatus('Notifications enabled successfully!');
//     } catch (err) {
//       console.error('Error subscribing to notifications:', err);
//       setStatus(`Error: ${err.message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleDisableNotifications = async () => {
//     if (!registration) return;

//     setIsLoading(true);
//     setStatus('Disabling notifications...');

//     try {
//       const subscription = await registration.pushManager.getSubscription();
//       if (subscription) {
//         await subscription.unsubscribe();
//       }
//       setIsSubscribed(false);
//       setStatus('Notifications disabled successfully!');
//     } catch (err) {
//       console.error('Error disabling notifications:', err);
//       setStatus(`Error: ${err.message}`);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const getPermissionStatus = () => {
//     switch (permission) {
//       case 'granted':
//         return { color: 'text-green-600', text: 'Granted' };
//       case 'denied':
//         return { color: 'text-red-600', text: 'Denied' };
//       default:
//         return { color: 'text-yellow-600', text: 'Not requested' };
//     }
//   };

//   const permissionStatus = getPermissionStatus();

//   return (
//     <div className="bg-white border border-gray-200 rounded-lg p-6">
//       <h3 className="text-lg font-medium text-gray-900 mb-4">
//         Notification Settings
//       </h3>

//       <div className="space-y-4">
//         <div className="flex items-center justify-between">
//           <span className="text-sm font-medium text-gray-700">Browser Permission:</span>
//           <span className={`text-sm font-medium ${permissionStatus.color}`}>{permissionStatus.text}</span>
//         </div>

//         <div className="flex items-center justify-between">
//           <span className="text-sm font-medium text-gray-700">Subscription Status:</span>
//           <span className={`text-sm font-medium ${isSubscribed ? 'text-green-600' : 'text-gray-500'}`}>
//             {isSubscribed ? 'Active' : 'Inactive'}
//           </span>
//         </div>

//         {status && (
//           <div className="bg-gray-50 border border-gray-200 rounded p-3">
//             <p className="text-sm text-gray-600">{status}</p>
//           </div>
//         )}

//         <div className="space-y-2">
//           {!isSubscribed ? (
//             <button
//               onClick={handleEnableNotifications}
//               disabled={isLoading || permission === 'denied'}
//               className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               {isLoading ? 'Setting up...' : 'Enable Notifications'}
//             </button>
//           ) : (
//             <button
//               onClick={handleDisableNotifications}
//               disabled={isLoading}
//               className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
//             >
//               {isLoading ? 'Disabling...' : 'Disable Notifications'}
//             </button>
//           )}
//         </div>

//         <div className="text-xs text-gray-500 space-y-1">
//           <p>• Task deadline notifications will be sent automatically</p>
//           <p>• You can disable notifications anytime from this page</p>
//           {permission === 'denied' && (
//             <p className="text-red-500">
//               • To enable notifications, reset permissions in your browser settings
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NotificationSettings;

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";
import subscribeUserToPush from "./subscribe";

export default function NotificationToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState("default");
  const VITE_VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  useEffect(() => {
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
            subscribeUserToPush()
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
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            {isEnabled ? (
              <Bell className="w-8 h-8 text-indigo-600" />
            ) : (
              <BellOff className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Notification Settings
          </h1>
          <p className="text-gray-600">
            {isEnabled
              ? "Notifications are enabled"
              : "Enable notifications to stay updated"}
          </p>
        </div>

        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-3">
            <Bell className="w-5 h-5 text-gray-700" />
            <span className="font-medium text-gray-800">
              Enable Notifications
            </span>
          </div>

          <button
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              isEnabled ? "bg-indigo-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                isEnabled ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Permission Status:</span>{" "}
            <span className="capitalize">{permissionStatus}</span>
          </p>
          {permissionStatus === "denied" && (
            <p className="text-xs text-blue-700 mt-2">
              You've blocked notifications. Please enable them in your browser
              settings to receive updates.
            </p>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Check your browser console for notification logs
          </p>
        </div>
      </div>
    </div>
  );
}
