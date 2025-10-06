// Install event
self.addEventListener("install", event => {
    console.log("Service Worker installing...");
    self.skipWaiting();
  });
  
  // Activate event
  self.addEventListener("activate", event => {
    console.log("Service Worker activating...");
    event.waitUntil(self.clients.claim());
  });
  
  // Handle push events
  self.addEventListener("push", event => {
    console.log("Push received:", event);
  
    const data = event.data.json();
    console.log("Push notification data:", data);
  
    event.waitUntil(
        (async () => {
          await self.registration.showNotification("Srivatsan", {
            body: "Friend Request",
            requireInteraction: true,
            icon: "/icon.png", 
            badge: "/icon.png",        
            image: "/icon.png" 
          });
          const allClients = await self.clients.matchAll({ includeUncontrolled: true });
          for (const client of allClients) {
            if (client.url.includes("/dashboard")) {
              client.postMessage({ type: "push-sound", payload: data });
            }
          }
          console.log("Notification shown");
        })()
      );
  });

// Handle notification click
self.addEventListener("notificationclick", event => {
  console.log("Notification clicked");

  event.notification.close();

  const targetUrl = "/dashboard";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      for (const client of allClients) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })()
  );
});
