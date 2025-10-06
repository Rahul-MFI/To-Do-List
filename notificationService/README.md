# Notification Service

A microservice for handling push notifications in the Todo application using the Web Push API.

## Features

- **Web Push Notifications**: Send push notifications to browsers using the Web Push API
- **Subscription Management**: Handle browser push subscription registration and management
- **Task Deadline Notifications**: Automatically send notifications for upcoming task deadlines
- **JWT Authentication**: Secure endpoints with JWT token validation
- **Database Integration**: Uses the same MySQL database as the main Todo application
- **Scheduled Processing**: Background scheduler for processing pending notifications and deadline checks

## Setup

### Prerequisites

- Go 1.24.5 or higher
- MySQL database (same as main Todo app)
- VAPID keys for Web Push API

### Environment Variables

Create a `.env` file in the notificationService directory with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=todo_db

# Server Configuration
PORT=8081

# JWT Configuration (should match main backend)
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=24h

# VAPID Keys for Web Push
VAPID_PUBLIC_KEY=your_vapid_public_key_here
VAPID_PRIVATE_KEY=your_vapid_private_key_here
VAPID_SUBJECT=mailto:your-email@example.com

# Notification Settings
NOTIFICATION_INTERVAL_HOURS=24
```

### Generate VAPID Keys

You can generate VAPID keys using the web-push library:

```bash
npx web-push generate-vapid-keys
```

### Installation

1. Navigate to the notification service directory:
   ```bash
   cd notificationService
   ```

2. Install dependencies:
   ```bash
   go mod tidy
   ```

3. Run the service:
   ```bash
   go run main.go
   ```

## API Endpoints

### Public Endpoints

- `GET /api/health` - Health check
- `GET /api/vapid-public-key` - Get VAPID public key for client-side subscription

### Protected Endpoints (Require JWT Authentication)

#### Subscriptions
- `POST /api/subscriptions` - Create/update push subscription
- `GET /api/subscriptions` - Get user's subscriptions
- `DELETE /api/subscriptions` - Delete subscription

#### Notifications
- `POST /api/notifications` - Create a notification
- `GET /api/notifications` - Get user's notifications (supports pagination)
- `GET /api/notifications/:id` - Get specific notification
- `POST /api/notifications/test` - Send test notification

### Admin Endpoints

- `POST /api/admin/notifications/process-pending` - Process pending notifications
- `POST /api/admin/notifications/deadline-check` - Check for task deadlines and create notifications

## Database Schema

The service creates the following tables:

### push_subscriptions
- `id` - Primary key
- `user_id` - Foreign key to users table
- `endpoint` - Browser push endpoint
- `p256dh_key` - Encryption key
- `auth_key` - Authentication key
- `created_at`, `updated_at` - Timestamps
- `is_active` - Subscription status

### notifications
- `id` - Primary key
- `user_id` - Foreign key to users table
- `task_id` - Optional foreign key to task table
- `workspace_id` - Optional foreign key to workspace table
- `title` - Notification title
- `message` - Notification message
- `type` - Notification type (task_deadline, task_reminder, etc.)
- `scheduled_at` - When to send the notification
- `sent_at` - When the notification was sent
- `status` - pending, sent, or failed
- `created_at`, `updated_at` - Timestamps

### notification_logs
- `id` - Primary key
- `notification_id` - Foreign key to notifications table
- `subscription_id` - Foreign key to push_subscriptions table
- `status` - success or failed
- `error_message` - Error details if failed
- `sent_at` - Timestamp

## Frontend Integration

To integrate with the frontend, you'll need to:

1. **Get VAPID Public Key**: Request the public key from `/api/vapid-public-key`

2. **Register Service Worker**: Create a service worker to handle push notifications

3. **Subscribe to Push Notifications**: Use the browser's Push API to create a subscription

4. **Send Subscription to Server**: Send the subscription object to `/api/subscriptions`

Example frontend code:

```javascript
// Get VAPID public key
const response = await fetch('/api/vapid-public-key');
const { public_key } = await response.json();

// Register service worker
const registration = await navigator.serviceWorker.register('/sw.js');

// Subscribe to push notifications
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(public_key)
});

// Send subscription to server
await fetch('/api/subscriptions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwt_token}`
  },
  body: JSON.stringify({
    endpoint: subscription.endpoint,
    keys: {
      p256dh: arrayBufferToBase64(subscription.keys.p256dh),
      auth: arrayBufferToBase64(subscription.keys.auth)
    }
  })
});
```

## Service Worker Example

Create a `sw.js` file in your frontend public directory:

```javascript
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      tag: data.tag,
      data: data.data,
      actions: data.actions || [],
      requireInteraction: true
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'mark_complete') {
    // Handle mark complete action
    event.waitUntil(
      fetch(`/api/tasks/${event.notification.data.taskId}/complete`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${getStoredJWT()}` }
      })
    );
  } else if (event.action === 'view_task') {
    // Handle view task action
    event.waitUntil(
      clients.openWindow(`/tasks/${event.notification.data.taskId}`)
    );
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
```

## Scheduler

The service includes a background scheduler that:
- Runs every 15 minutes by default
- Processes pending notifications
- Checks for upcoming task deadlines
- Creates deadline notifications automatically

## Security

- All endpoints except health check and VAPID public key require JWT authentication
- Users can only manage their own subscriptions and notifications
- VAPID keys should be kept secure and not exposed to clients (except public key)

## Deployment

1. Build the application:
   ```bash
   go build -o notification-service
   ```

2. Run the service:
   ```bash
   ./notification-service
   ```

3. The service will run on port 8081 by default (configurable via PORT environment variable)

## Monitoring

- Check `/api/health` for service health
- Monitor database connections and notification delivery success rates
- Watch for failed push subscriptions (endpoints returning 410/404 status codes)
