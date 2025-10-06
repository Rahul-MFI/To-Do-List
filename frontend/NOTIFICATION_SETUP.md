# 🔔 Notification Service Integration Guide

This guide explains how the notification service has been integrated into your React frontend.

## 📁 **New File Structure**

```
frontend/
├── public/                    ← NEW: Static files directory
│   ├── sw.js                 ← NEW: Service worker for push notifications
│   ├── manifest.json         ← NEW: PWA manifest
│   └── icon-192x192.png      ← NEW: Notification icon
├── src/
│   ├── utils/
│   │   └── notificationClient.js  ← NEW: Notification client utility
│   ├── components/
│   │   └── NotificationSettings.jsx  ← NEW: Settings component
│   └── main.jsx              ← UPDATED: Auto-initialize notifications
├── index.html                ← UPDATED: Added manifest link
└── ...
```

## 🚀 **What Was Added**

### 1. **Service Worker** (`/public/sw.js`)
- Handles incoming push notifications
- Manages notification clicks and actions
- Automatically placed in the correct location for Vite

### 2. **Notification Client** (`/src/utils/notificationClient.js`)
- JavaScript class for managing push subscriptions
- Handles VAPID key fetching and browser permissions
- Communicates with your notification service (port 8081)

### 3. **Settings Component** (`/src/components/NotificationSettings.jsx`)
- Ready-to-use UI for notification management
- Enable/disable notifications
- Send test notifications
- Shows permission status

### 4. **Auto-Initialisation** (`/src/main.jsx`)
- Automatically initializes notifications on app start
- Auto-subscribes users who already granted permission

## 🔧 **How to Use**

### **Option 1: Add to Your Dashboard**

Add the notification settings component to your dashboard:

```jsx
// In src/pages/Dashboard.jsx
import NotificationSettings from '../components/NotificationSettings';

function Dashboard() {
  return (
    <div>
      {/* Your existing dashboard content */}
      
      {/* Add notification settings */}
      <NotificationSettings />
    </div>
  );
}
```

### **Option 2: Manual Integration**

Use the notification client directly in your components:

```jsx
// In any component
import { useState, useEffect } from 'react';
import NotificationClient from '../utils/notificationClient';

function MyComponent() {
  const [client, setClient] = useState(null);

  useEffect(() => {
    const initNotifications = async () => {
      const notificationClient = new NotificationClient();
      await notificationClient.init();
      setClient(notificationClient);
    };
    
    initNotifications();
  }, []);

  const enableNotifications = async () => {
    if (client) {
      await client.requestPermission();
      await client.subscribe();
    }
  };

  return (
    <button onClick={enableNotifications}>
      Enable Notifications
    </button>
  );
}
```

## 🌐 **Service URLs**

The notification client is configured to use:
- **Development**: `http://localhost:8081` (notification service)
- **Production**: Same domain as your frontend

## 🔒 **Authentication**

The notification client automatically looks for JWT tokens in:
1. `localStorage.getItem('jwt_token')`
2. `localStorage.getItem('token')`
3. `sessionStorage.getItem('jwt_token')`
4. `sessionStorage.getItem('token')`
5. Cookie: `jwt_token`

**Update the `getJwtToken()` method** in `notificationClient.js` if your app stores tokens differently.

## 🚨 **Important Notes**

1. **HTTPS Required**: Push notifications only work on HTTPS in production
2. **Service Worker Scope**: The service worker is registered at root (`/`) scope
3. **Browser Support**: Works in Chrome, Firefox, Safari, Edge
4. **Permission Required**: Users must grant notification permission

## 🧪 **Testing**

1. Start your frontend: `npm run dev`
2. Start the notification service: `cd ../notificationService && go run main.go`
3. Open browser developer tools > Application > Service Workers
4. Verify the service worker is registered
5. Use the NotificationSettings component to test

## 🔄 **Next Steps**

1. **Style the component**: Customize `NotificationSettings.jsx` to match your design
2. **Add to navigation**: Add notification settings to your app's settings page
3. **Task integration**: The service will automatically send deadline notifications
4. **Icons**: Replace placeholder icons with your app's actual icons

## 🐛 **Troubleshooting**

### Service Worker Not Registering
- Check browser console for errors
- Ensure `sw.js` is in `/public/` directory
- Verify HTTPS is used (or localhost for development)

### Notifications Not Received
- Check notification permission status
- Verify notification service is running on port 8081
- Check browser console for subscription errors
- Ensure JWT token is valid

### CORS Issues
- The notification service includes CORS headers
- Ensure the frontend and notification service URLs are correctly configured

## 📱 **PWA Features**

The setup also includes:
- Web app manifest (`manifest.json`)
- App icons for installation
- Offline-ready service worker base

Your Todo app is now ready for push notifications! 🎉
