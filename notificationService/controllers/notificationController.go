package controllers

import (
	"database/sql"
	"encoding/json"
	"io"
	"log"
	"net/http"

	"notificationService/config"
	"notificationService/model"
	"notificationService/utils"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/gin-gonic/gin"
)

// SendNotifications is the HTTP handler for POST /api/send-notifications.
func SendNotifications(c *gin.Context) {
	if config.Db == nil || config.Db.Conn == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "database not configured"})
		return
	}
	env := utils.GetEnv()
	sendNotifications(config.Db.Conn, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY, env.VAPID_SUBSCRIBER)
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func sendNotifications(db *sql.DB, vapidPublicKey, vapidPrivateKey, vapidSubscriber string) {
	query := `
	SELECT n.n_id, n.t_id, t.markCompleted, n.s_id, n.duration, s.endpoint, s.p256dh, s.auth, s.active, n.title, n.message, n.status, n.scheduled_at
	FROM notifications n
	INNER JOIN task t ON n.t_id = t.t_id
	INNER JOIN subscriptions s ON n.s_id = s.s_id
	WHERE n.status = 'pending'
	  AND (n.scheduled_at <= UTC_TIMESTAMP() OR ABS(TIMESTAMPDIFF(MINUTE, UTC_TIMESTAMP(), n.scheduled_at)) < 1)
	  AND t.markCompleted = 0
	  AND s.active = 1;
	`

	rows, err := db.Query(query)
	if err != nil {
		log.Println("❌ Query error:", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var n model.NotificationRow
		if err := rows.Scan(&n.NotificationID, &n.TaskID, &n.MarkCompleted, &n.SubscriptionID, &n.Duration, &n.Endpoint, &n.P256dh, &n.Auth, &n.Active, &n.Title, &n.Message, &n.Status, &n.ScheduledAt); err != nil {
			log.Println("❌ Row scan error:", err)
			continue
		}

		payload := map[string]interface{}{
			"title": n.Title,
			"body":  n.Message,
			"data": map[string]interface{}{
				"taskId": n.TaskID,
			},
		}
		payloadJSON, _ := json.Marshal(payload)

		resp, err := webpush.SendNotification(payloadJSON, &webpush.Subscription{
			Endpoint: n.Endpoint,
			Keys: webpush.Keys{
				P256dh: n.P256dh,
				Auth:   n.Auth,
			},
		}, &webpush.Options{
			Subscriber:      vapidSubscriber,
			VAPIDPublicKey:  vapidPublicKey,
			VAPIDPrivateKey: vapidPrivateKey,
			TTL:             30,
		})

		status := "sent"
		if err != nil {
			log.Printf("❌ Error sending push to endpoint %s: %v\n", n.Endpoint, err)
			updateNotificationStatus(db, n.NotificationID, "failed")
			continue
		}

		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			if resp.StatusCode == http.StatusGone {
				log.Printf("❌ Subscription expired (410 Gone) for task %d, deleting subscription\n", n.TaskID)
				deleteSubscription(db, n.SubscriptionID)
				status = "failed"
			} else {
				log.Printf("❌ Notification failed for task %d: status=%d, endpoint=%s, body=%s\n", n.TaskID, resp.StatusCode, n.Endpoint, string(body))
				status = "failed"
			}
		} else {
			log.Printf("✅ Notification sent successfully for task %d\n", n.TaskID)
		}
		updateNotificationStatus(db, n.NotificationID, status)
	}
}

func updateNotificationStatus(db *sql.DB, notificationID int, status string) {
	if _, err := db.Exec(`UPDATE notifications SET status = ?, sent_at = UTC_TIMESTAMP() WHERE n_id = ?`, status, notificationID); err != nil {
		log.Printf("❌ Failed to update notification %d: %v\n", notificationID, err)
	}
}

func deleteSubscription(db *sql.DB, subscriptionID int) {
	if _, err := db.Exec("DELETE FROM subscriptions WHERE s_id = ?", subscriptionID); err != nil {
		log.Printf("❌ Failed to delete subscription %d: %v\n", subscriptionID, err)
	}
}
