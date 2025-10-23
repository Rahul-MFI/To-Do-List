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
        console.log("🔔 Starting push subscription process...");
        console.log("🔍 VAPID Public Key:", VITE_VAPID_PUBLIC_KEY);
        
        // Register service worker
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("✅ Service Worker registered");
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log("✅ Service Worker ready");
        
        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();
        console.log("🔍 Existing subscription:", subscription ? "Found" : "None");
        
        if (!subscription) {
            console.log("🔔 Creating new push subscription...");
            
            // Check if VAPID key is available
            if (!VITE_VAPID_PUBLIC_KEY) {
                throw new Error("VAPID Public Key not found in environment variables");
            }
            
            // Convert VAPID key for iOS Safari compatibility
            const applicationServerKey = urlBase64ToUint8Array(VITE_VAPID_PUBLIC_KEY);
            console.log("🔍 Application Server Key length:", applicationServerKey.length);
            
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey,
            });
            console.log("✅ New subscription created");
        }
        
        // Convert subscription to JSON
        subscription = JSON.parse(JSON.stringify(subscription));
        console.log("📤 Push subscription data:", JSON.stringify(subscription, null, 2));
        
        // Send subscription to backend
        const response = await axiosInstance.post("/subscribe", {
            "endpoint": subscription.endpoint,
            "expirationTime": null,
            "keys": {
                "p256dh": subscription.keys.p256dh,
                "auth": subscription.keys.auth,
            },
        });
        
        console.log("✅ Subscription sent to backend successfully");
        return response.data;
        
    } catch (error) {
        console.error("❌ Error in push subscription:", error);
        
        // Handle specific iOS Safari errors
        if (error.name === 'NotSupportedError') {
            console.warn("Push notifications not supported on this device/browser");
        } else if (error.name === 'NotAllowedError') {
            console.warn("Push notification permission denied");
        } else if (error.name === 'AbortError') {
            console.warn("Push subscription was aborted");
        }
        
        throw error;
    }
  } else {
    console.warn("Push not supported on this browser.");
    throw new Error("Push notifications not supported");
  }
}


export default subscribeUserToPush;
