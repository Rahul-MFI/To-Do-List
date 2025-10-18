// utils/pushService.js
import axiosInstance from "../../middleware/axiosInstance";

const VITE_VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
  
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
  
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

export async function subscribeUserToPush(setOnline = null, setSession = null) {
  if ("serviceWorker" in navigator && "PushManager" in window) {
    try {
        await navigator.serviceWorker.register("/sw.js");
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VITE_VAPID_PUBLIC_KEY),
            })
        }
        subscription = JSON.parse(JSON.stringify(subscription));
        console.log("Push subscription:", (JSON.stringify(subscription)));
        const response = await axiosInstance.post("/subscribe", {
            "endpoint": subscription.endpoint,
            "expirationTime": null,
            "keys": {
                "p256dh": subscription.keys.p256dh,
                "auth": subscription.keys.auth,
            },
        });
        return response.data;
    } catch (err) {
      if (err.code === "ERR_NETWORK" && setOnline) {
        setOnline(false);
      } else if (err.status === 401 && setSession) {
        setSession(false);
      }
      console.error("Push subscription failed:", err);
    }
  } else {
    console.warn("Push not supported on this browser.");
  }
}


export default subscribeUserToPush;
