package service

import (
	"ToDo/config"
	"database/sql"
	"errors"
	"net/http"
	"time"
)

// Update task
func Subscribe(endpoint string, p256dh string, auth string, u_id int) (int, error) {
	var sID int
	err := config.Db.Conn.QueryRow(
		"SELECT s_id FROM subscriptions WHERE endpoint=? AND p256dh=? AND auth=?",
		endpoint, p256dh, auth,
	).Scan(&sID)

	if err != nil {
		if err == sql.ErrNoRows {
			_, err := config.Db.Conn.Exec("INSERT INTO subscriptions (endpoint, p256dh, auth, u_id, created_at, active) VALUES (?, ?, ?, ?, ?, ?)", endpoint, p256dh, auth, u_id, time.Now(), true)
			if err != nil {
				return http.StatusInternalServerError, errors.New("database error 1")
			}
		} else {
			return http.StatusInternalServerError, errors.New("database error 2")
		}
	} else {
		_, err := config.Db.Conn.Exec("UPDATE subscriptions SET u_id = ?, active = ? ,created_at = ? WHERE s_id = ?", u_id, true, time.Now(), sID)
		if err != nil {
			return http.StatusInternalServerError, errors.New("database error 3")
		}
	}
	return http.StatusOK, nil
}

func Unsubscribe(endpoint string, p256dh string, auth string, u_id int) (int, error) {
	_, err := config.Db.Conn.Exec("DELETE FROM subscriptions WHERE endpoint = ? AND p256dh = ? AND auth = ? AND u_id = ?", endpoint, p256dh, auth, u_id)
	if err != nil {
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

func IsSubscribed(endpoint string, p256dh string, auth string, u_id int) (bool, int, error) {
	var isActive bool
	err := config.Db.Conn.QueryRow("SELECT active FROM subscriptions WHERE endpoint = ? AND p256dh = ? AND auth = ? AND u_id = ?", endpoint, p256dh, auth, u_id).Scan(&isActive)
	if err != nil {
		if err == sql.ErrNoRows {
			return false, http.StatusOK, nil
		}
		return false, http.StatusInternalServerError, err
	}
	return isActive, http.StatusOK, nil
}
