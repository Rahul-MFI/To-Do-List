package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"notificationService/config"
	"notificationService/utils"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/robfig/cron/v3"
)

type NotificationRow struct {
	NotificationID int       `db:"n_id"`
	TaskID         int       `db:"t_id"`
	MarkCompleted  bool      `db:"markCompleted"`
	SubscriptionID int       `db:"s_id"`
	Duration       int       `db:"duration"`
	Endpoint       string    `db:"endpoint"`
	P256dh         string    `db:"p256dh"`
	Auth           string    `db:"auth"`
	Active         bool      `db:"active"`
	Title          string    `db:"title"`
	Message        string    `db:"message"`
	Status         string    `db:"status"`
	ScheduledAt    time.Time `db:"scheduled_at"`
}

type PushResponse struct {
	Message  string `json:"message"`
	Response string `json:"response"`
	Status   string `json:"status"`
}

// sendNotifications fetches pending notifications and sends them via Web Push
func sendNotifications(db *sql.DB, vapidPublicKey, vapidPrivateKey string) {
	query := `
	SELECT n.n_id, n.t_id, t.markCompleted, n.s_id, n.duration, s.endpoint, s.p256dh, s.auth, s.active, n.title, n.message, n.status, n.scheduled_at
	FROM notifications n
	INNER JOIN task t ON n.t_id = t.t_id
	INNER JOIN subscriptions s ON n.s_id = s.s_id
	WHERE n.status = 'pending'
	  AND (n.scheduled_at <= NOW() OR ABS(TIMESTAMPDIFF(MINUTE, NOW(), n.scheduled_at)) < 5)
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
		var n NotificationRow
		if err := rows.Scan(&n.NotificationID, &n.TaskID, &n.MarkCompleted, &n.SubscriptionID, &n.Duration, &n.Endpoint, &n.P256dh, &n.Auth, &n.Active, &n.Title, &n.Message, &n.Status, &n.ScheduledAt); err != nil {
			log.Println("❌ Row scan error:", err)
			continue
		}

		// Build Web Push payload
		payload := map[string]interface{}{
			"title": n.Title,
			"body":  n.Message,
			"data": map[string]interface{}{
				"taskId": n.TaskID,
			},
		}
		payloadJSON, _ := json.Marshal(payload)

		// Send push notification
		resp, err := webpush.SendNotification(payloadJSON, &webpush.Subscription{
			Endpoint: n.Endpoint,
			Keys: webpush.Keys{
				P256dh: n.P256dh,
				Auth:   n.Auth,
			},
		}, &webpush.Options{
			Subscriber:      "mailto:example@example.com",
			VAPIDPublicKey:  vapidPublicKey,
			VAPIDPrivateKey: vapidPrivateKey,
			TTL:             30,
		})
		status := "sent"
		if err != nil {
			log.Fatal("Error sending push:", err)
		}
		defer resp.Body.Close()

		// Print HTTP status
		if resp.Status != "201 Created" {
			if resp.Status == "410 Gone" {
				log.Printf("❌ Subscription expired (410 Gone) for task %d, deleting subscription\n", n.TaskID)
				deleteSubscription(db, n.SubscriptionID)
				status = "failed"
			} else {
				log.Printf("❌ Notification failed with status code: %d\n", resp.StatusCode)
				status = "failed"
			}
		} else {
			status = "sent"
			log.Printf("✅ Notification sent successfully for task %d\n", n.TaskID)
		}
		_, err = db.Exec(`UPDATE notifications SET status = ?, sent_at = NOW() WHERE n_id = ?`, status, n.NotificationID)
		if err != nil {
			log.Printf("❌ Failed to update notification %d: %v\n", n.NotificationID, err)
		}
	}
}

func deleteSubscription(db *sql.DB, subscriptionID int) {
	_, err := db.Exec("DELETE FROM subscriptions WHERE s_id = ?", subscriptionID)
	if err != nil {
		log.Printf("❌ Failed to delete subscription %d: %v\n", subscriptionID, err)
	}
}

func main() {
	// Load env variables
	utils.LoadEnv(".env")
	env := utils.GetEnv()

	// Connect to DB
	config.ConnectDatabase()
	db := config.Db.Conn

	vapidPublicKey := env.VAPID_PUBLIC_KEY
	vapidPrivateKey := env.VAPID_PRIVATE_KEY

	// Start cron scheduler
	c := cron.New()
	// Run every 1 minute (or use @every 10s for testing)
	c.AddFunc("@every 60s", func() {
		log.Println("⏰ Running scheduled push job...")
		sendNotifications(db, vapidPublicKey, vapidPrivateKey)
	})
	c.Start()

	fmt.Println("🚀 Cron scheduler started, sending notifications every 1 minute")
	select {} // Block forever
}
