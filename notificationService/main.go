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
	  AND n.scheduled_at <= NOW()
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
	c.AddFunc("@every 10s", func() {
		log.Println("⏰ Running scheduled push job...")
		sendNotifications(db, vapidPublicKey, vapidPrivateKey)
	})
	c.Start()

	fmt.Println("🚀 Cron scheduler started, sending notifications every 1 minute")
	select {} // Block forever
}

// package main

// import (
// 	"bytes"
// 	"encoding/json"
// 	"fmt"
// 	"log"
// 	"net/http"
// 	"notificationService/utils"

// 	"github.com/SherClockHolmes/webpush-go"
// 	"github.com/gin-gonic/gin"
// )

// type Subscription struct {
// 	Endpoint string `json:"endpoint"`
// 	Keys     struct {
// 		P256dh string `json:"p256dh"`
// 		Auth   string `json:"auth"`
// 	} `json:"keys"`
// }

// func main() {
// 	// Hardcoded subscription (copy this from your frontend console log)
// 	subscriptionJSON := `{"endpoint":"https://fcm.googleapis.com/fcm/send/dMU6AvYK5sI:APA91bHeW2wTKhkH3C8iSErW-f-l2St_1PCk7sDHMkjlKavCkMJ0QvRnpqFYDmsbmpala9jqkK0mfji_NDxtoHTLU682EXp1Qip6EgwipXPSCXAcpA7dtwvbz9mvCw3XEhR5NX-jwdNv","expirationTime":null,"keys":{"p256dh":"BA9WaElgvgp5CwdFRHIujxofdlYTj37T14uyjeobnGyGFOko0N-8iIasB1cYqfJYbqkr1tnEBgqWFUaT-kCzaD0","auth":"5aZaS-0XofKm7RCQGbgptQ"}}`

// 	// Hardcoded VAPID keys (replace with your own)
// 	utils.LoadEnv(".env")
// 	vapidPublicKey := utils.GetEnv().VAPID_PUBLIC_KEY
// 	vapidPrivateKey := utils.GetEnv().VAPID_PRIVATE_KEY

// 	var sub Subscription
// 	if err := json.Unmarshal([]byte(subscriptionJSON), &sub); err != nil {
// 		log.Fatal("Invalid subscription JSON:", err)
// 	}

// 	router := gin.Default()

// 	router.POST("/send", func(c *gin.Context) {
// 		// Hardcoded notification payload
// 		notification := map[string]interface{}{
// 			"title": "Hello from Go ",
// 			"body":  "This is a test push notification",
// 			"data": map[string]string{
// 				"taskId": "123",
// 			},
// 		}
// 		payload, _ := json.Marshal(notification)

// 		resp, err := webpush.SendNotification(payload, &webpush.Subscription{
// 			Endpoint: sub.Endpoint,
// 			Keys: webpush.Keys{
// 				P256dh: sub.Keys.P256dh,
// 				Auth:   sub.Keys.Auth,
// 			},
// 		}, &webpush.Options{
// 			Subscriber:      "mailto:test@example.com",
// 			VAPIDPublicKey:  vapidPublicKey,
// 			VAPIDPrivateKey: vapidPrivateKey,
// 			TTL:             30,
// 		})

// 		if err != nil {
// 			log.Println("❌ Error sending notification:", err)
// 			c.JSON(http.StatusInternalServerError, gin.H{"error": "push failed"})
// 			return
// 		}
// 		defer resp.Body.Close()

// 		buf := new(bytes.Buffer)
// 		buf.ReadFrom(resp.Body)

// 		c.JSON(http.StatusOK, gin.H{
// 			"message":  "Push sent successfully",
// 			"status":   resp.Status,
// 			"response": buf.String(),
// 		})
// 	})

// 	fmt.Println("🚀 Server running on :8080")
// 	router.Run(":8080")
// }
