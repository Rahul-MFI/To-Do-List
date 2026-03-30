package handler

import (
	"database/sql"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	"notificationService/config"
	"notificationService/utils"

	"github.com/SherClockHolmes/webpush-go"
	_ "github.com/go-sql-driver/mysql"
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

// Handler is the Vercel serverless function entry point.
// Vercel cron calls GET /api/notify on the configured schedule.
func Handler(w http.ResponseWriter, r *http.Request) {
	utils.LoadEnv(".env")
	env := utils.GetEnv()

	if err := config.ConnectDatabase(); err != nil {
		log.Println("❌ DB connection error:", err)
		http.Error(w, "DB connection failed", http.StatusInternalServerError)
		return
	}
	defer config.Db.Close()

	sendNotifications(config.Db.Conn, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY, env.VAPID_SUBSCRIBER)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

func sendNotifications(db *sql.DB, vapidPublicKey, vapidPrivateKey, vapidSubscriber string) {
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
	if _, err := db.Exec(`UPDATE notifications SET status = ?, sent_at = NOW() WHERE n_id = ?`, status, notificationID); err != nil {
		log.Printf("❌ Failed to update notification %d: %v\n", notificationID, err)
	}
}

func deleteSubscription(db *sql.DB, subscriptionID int) {
	if _, err := db.Exec("DELETE FROM subscriptions WHERE s_id = ?", subscriptionID); err != nil {
		log.Printf("❌ Failed to delete subscription %d: %v\n", subscriptionID, err)
	}
}
