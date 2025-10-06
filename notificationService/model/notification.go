package model

import (
	"time"
)

// NotificationType represents the type of notification
type NotificationType string

const (
	TaskDeadline    NotificationType = "task_deadline"
	TaskReminder    NotificationType = "task_reminder"
	WorkspaceInvite NotificationType = "workspace_invite"
	General         NotificationType = "general"
)

// NotificationStatus represents the status of a notification
type NotificationStatus string

const (
	Pending NotificationStatus = "pending"
	Sent    NotificationStatus = "sent"
	Failed  NotificationStatus = "failed"
)

// Notification represents a notification to be sent
type Notification struct {
	ID          int                `json:"id" db:"id"`
	UserID      int                `json:"user_id" db:"user_id"`
	TaskID      *int               `json:"task_id,omitempty" db:"task_id"`
	WorkspaceID *int               `json:"workspace_id,omitempty" db:"workspace_id"`
	Title       string             `json:"title" db:"title"`
	Message     string             `json:"message" db:"message"`
	Type        NotificationType   `json:"type" db:"type"`
	ScheduledAt time.Time          `json:"scheduled_at" db:"scheduled_at"`
	SentAt      *time.Time         `json:"sent_at,omitempty" db:"sent_at"`
	Status      NotificationStatus `json:"status" db:"status"`
	CreatedAt   time.Time          `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at" db:"updated_at"`
}

// NotificationRequest represents the request body for creating notifications
type NotificationRequest struct {
	UserID      int              `json:"user_id" binding:"required"`
	TaskID      *int             `json:"task_id,omitempty"`
	WorkspaceID *int             `json:"workspace_id,omitempty"`
	Title       string           `json:"title" binding:"required"`
	Message     string           `json:"message" binding:"required"`
	Type        NotificationType `json:"type"`
	ScheduledAt *time.Time       `json:"scheduled_at,omitempty"`
}

// ToModel converts NotificationRequest to Notification
func (nr *NotificationRequest) ToModel() *Notification {
	scheduledAt := time.Now()
	if nr.ScheduledAt != nil {
		scheduledAt = *nr.ScheduledAt
	}

	notificationType := General
	if nr.Type != "" {
		notificationType = nr.Type
	}

	return &Notification{
		UserID:      nr.UserID,
		TaskID:      nr.TaskID,
		WorkspaceID: nr.WorkspaceID,
		Title:       nr.Title,
		Message:     nr.Message,
		Type:        notificationType,
		ScheduledAt: scheduledAt,
		Status:      Pending,
	}
}

// NotificationLog represents a log entry for notification delivery attempts
type NotificationLog struct {
	ID             int       `json:"id" db:"id"`
	NotificationID int       `json:"notification_id" db:"notification_id"`
	SubscriptionID int       `json:"subscription_id" db:"subscription_id"`
	Status         string    `json:"status" db:"status"`
	ErrorMessage   *string   `json:"error_message,omitempty" db:"error_message"`
	SentAt         time.Time `json:"sent_at" db:"sent_at"`
}

// PushPayload represents the payload sent to the browser
type PushPayload struct {
	Title   string      `json:"title"`
	Body    string      `json:"body"`
	Icon    string      `json:"icon,omitempty"`
	Badge   string      `json:"badge,omitempty"`
	Tag     string      `json:"tag,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Actions []Action    `json:"actions,omitempty"`
}

// Action represents a notification action
type Action struct {
	Action string `json:"action"`
	Title  string `json:"title"`
	Icon   string `json:"icon,omitempty"`
}
