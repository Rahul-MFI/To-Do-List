// package main

// import (
// 	"bytes"
// 	"database/sql"
// 	"encoding/json"
// 	"fmt"
// 	"log"
// 	"time"

// 	"notificationService/config"
// 	"notificationService/utils"

// 	"github.com/SherClockHolmes/webpush-go"
// 	"github.com/robfig/cron/v3"
// )

// type Subscription struct {
// 	Endpoint string
// 	P256dh   string
// 	Auth     string
// 	UserID   int
// }

// type Schedule struct {
// 	ScheduleID int
// 	Title      string
// 	Message    string
// 	Deadline   time.Time
// 	UserID     int
// }

// func sendNotification(db *sql.DB, vapidPublicKey, vapidPrivateKey string) {
// 	rows, err := db.Query(`
// 		SELECT
// 		s.endpoint,
// 		s.p256dh,
// 		s.auth,
// 		ts.title,
// 		ts.message,
// 	FROM subscriptions s
// 	INNER JOIN table_schedule ts
// 		ON s.u_id = ts.u_id
// 	INNER JOIN task t
// 		ON ts.t_id = t.t_id
// 	WHERE
// 		t.markCompleted = FALSE
// 		AND s.active = TRUE
// 		AND ABS(TIMESTAMPDIFF(SECOND, NOW(), ts.deadline)) <= 75;
// 	`)
// 	if err != nil {
// 		log.Println("Query error:", err)
// 		return
// 	}
// 	defer rows.Close()

// 	for rows.Next() {
// 		var sub Subscription
// 		var sched Schedule

// 		err := rows.Scan(&sub.Endpoint, &sub.P256dh, &sub.Auth, &sched.Title, &sched.Message)
// 		if err != nil {
// 			log.Println("Scan error:", err)
// 			continue
// 		}

// 		// Build notification payload
// 		notification := map[string]interface{}{
// 			"title": sched.Title,
// 			"body":  sched.Message,
// 			"data": map[string]string{
// 				"workspaceId": "12",
// 			},
// 		}
// 		payload, _ := json.Marshal(notification)

// 		// Send push
// 		resp, err := webpush.SendNotification(payload, &webpush.Subscription{
// 			Endpoint: sub.Endpoint,
// 			Keys: webpush.Keys{
// 				P256dh: sub.P256dh,
// 				Auth:   sub.Auth,
// 			},
// 		}, &webpush.Options{
// 			Subscriber:      "mailto:rahul@example.com",
// 			VAPIDPublicKey:  vapidPublicKey,
// 			VAPIDPrivateKey: vapidPrivateKey,
// 			TTL:             30,
// 		})

// 		if err != nil {
// 			log.Printf("❌ Error sending notification to %s: %v\n", sub.Endpoint, err)
// 			continue
// 		}
// 		defer resp.Body.Close()

// 		buf := new(bytes.Buffer)
// 		buf.ReadFrom(resp.Body)
// 		log.Printf("✅ Push sent (schedule_id=%d) → %s\n", sched.ScheduleID, resp.Status)
// 	}
// }

// func main() {
// 	utils.LoadEnv(".env")
// 	env := utils.GetEnv()

// 	fmt.Println("Server running on http://localhost:3001")
// 	config.ConnectDatabase()

// 	vapidPublicKey := env.VAPID_PUBLIC_KEY
// 	vapidPrivateKey := env.VAPID_PRIVATE_KEY

// 	// Start cron scheduler
// 	c := cron.New()
// 	// Every 1 minute
// 	c.AddFunc("@every 10s", func() {
// 		log.Println("⏰ Running scheduled push job...")
// 		sendNotification(config.Db.Conn, vapidPublicKey, vapidPrivateKey)
// 	})
// 	c.Start()

// 	fmt.Println("🚀 Cron scheduler started, sending notifications every 1 minute")
// 	select {}
// }

package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"notificationService/utils"

	"github.com/SherClockHolmes/webpush-go"
	"github.com/gin-gonic/gin"
)

type Subscription struct {
	Endpoint string `json:"endpoint"`
	Keys     struct {
		P256dh string `json:"p256dh"`
		Auth   string `json:"auth"`
	} `json:"keys"`
}

func main() {
	// Hardcoded subscription (copy this from your frontend console log)
	subscriptionJSON := `{"endpoint":"https://fcm.googleapis.com/fcm/send/f97Qx_g2j50:APA91bGwXmS00_8jOKYHsj77Btmsa1GfD0CrHXKcW-phertEQQt3jIfUaSc7j0iR_vnRXc8T8nBgOF1YjhXqDP-8F-ixzNFtMYm9_dk3pi2Vsl1YzgfspEr_DxzfVetNl8qgSnUScAbt","expirationTime":null,"keys":{"p256dh":"BOSP_V1OXN_ErhFl4tAtjCKNLBqXZ4EPbi_rJbLppoRaBor5h3-pD4OzsX-JvLmzoNtcktG3CJf5QxeNWwKpKyU","auth":"LIOJ-9N273OOGXQts0_Dbw"}}`

	// Hardcoded VAPID keys (replace with your own)
	utils.LoadEnv(".env")
	vapidPublicKey := utils.GetEnv().VAPID_PUBLIC_KEY
	vapidPrivateKey := utils.GetEnv().VAPID_PRIVATE_KEY

	var sub Subscription
	if err := json.Unmarshal([]byte(subscriptionJSON), &sub); err != nil {
		log.Fatal("Invalid subscription JSON:", err)
	}

	router := gin.Default()

	router.POST("/send", func(c *gin.Context) {
		// Hardcoded notification payload
		notification := map[string]interface{}{
			"title": "Hello from Go ",
			"body":  "This is a test push notification",
			"data": map[string]string{
				"taskId": "123",
			},
		}
		payload, _ := json.Marshal(notification)

		resp, err := webpush.SendNotification(payload, &webpush.Subscription{
			Endpoint: sub.Endpoint,
			Keys: webpush.Keys{
				P256dh: sub.Keys.P256dh,
				Auth:   sub.Keys.Auth,
			},
		}, &webpush.Options{
			Subscriber:      "mailto:test@example.com",
			VAPIDPublicKey:  vapidPublicKey,
			VAPIDPrivateKey: vapidPrivateKey,
			TTL:             30,
		})

		if err != nil {
			log.Println("❌ Error sending notification:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "push failed"})
			return
		}
		defer resp.Body.Close()

		buf := new(bytes.Buffer)
		buf.ReadFrom(resp.Body)

		c.JSON(http.StatusOK, gin.H{
			"message":  "Push sent successfully",
			"status":   resp.Status,
			"response": buf.String(),
		})
	})

	fmt.Println("🚀 Server running on :8080")
	router.Run(":8080")
}
