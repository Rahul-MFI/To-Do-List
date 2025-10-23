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
  
    let data;
    try {
      data = event.data ? event.data.json() : {};
    } catch (error) {
      console.error("Error parsing push data:", error);
      data = {};
    }
    console.log("Push notification data:", data);
  
    event.waitUntil(
        (async () => {
          try {
            // Use actual notification data from the push payload
            const title = data.title || "Task Reminder";
            const body = data.body || "You have a task reminder";
            
            const notificationOptions = {
              body: body,
              icon: "/icon.png", 
              badge: "/icon.png",
              requireInteraction: true,
            };
            
            await self.registration.showNotification(title, notificationOptions);
            console.log("Notification shown successfully");
            
            // Send message to all clients
            const allClients = await self.clients.matchAll({ includeUncontrolled: true });
            for (const client of allClients) {
              if (client.url.includes("/") || client.url.includes("/settings")) {
                client.postMessage({ type: "push-sound", payload: data });
              }
            }
            console.log("Notification shown successfully");
          } catch (error) {
            console.error("Error showing notification:", error);
            // Fallback notification for iOS Safari
            await self.registration.showNotification("Task Reminder", {
              body: "You have a task reminder",
              icon: "/icon.png",
              badge: "/icon.png"
            });
          }
        })()
      );
  });

// Handle notification click
self.addEventListener("notificationclick", event => {
  console.log("Notification clicked");

  event.notification.close();

  const targetUrl = "/";

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
