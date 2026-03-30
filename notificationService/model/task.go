package model

import (
	"time"
)

// Task represents a task from the main application
// This is used for fetching task information for notifications
type Task struct {
	ID            int       `json:"t_id" db:"t_id"`
	Name          string    `json:"t_name" db:"t_name"`
	Priority      int       `json:"priority" db:"priority"`
	MarkCompleted bool      `json:"markCompleted" db:"markCompleted"`
	Deadline      time.Time `json:"deadline" db:"deadline"`
	WorkspaceID   int       `json:"w_id" db:"w_id"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

// User represents a user from the main application
type User struct {
	ID       int    `json:"u_id" db:"u_id"`
	Username string `json:"username" db:"username"`
	Email    string `json:"email" db:"email"`
}

// Workspace represents a workspace from the main application
type Workspace struct {
	ID     int    `json:"w_id" db:"w_id"`
	Name   string `json:"w_name" db:"w_name"`
	UserID int    `json:"u_id" db:"u_id"`
}

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
