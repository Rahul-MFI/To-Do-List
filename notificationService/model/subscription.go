package model

import (
	"time"
)

// PushSubscription represents a browser push subscription
type PushSubscription struct {
	ID        int       `json:"id" db:"id"`
	UserID    int       `json:"user_id" db:"user_id"`
	Endpoint  string    `json:"endpoint" db:"endpoint" binding:"required"`
	P256dhKey string    `json:"p256dh_key" db:"p256dh_key" binding:"required"`
	AuthKey   string    `json:"auth_key" db:"auth_key" binding:"required"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
	IsActive  bool      `json:"is_active" db:"is_active"`
}

// SubscriptionRequest represents the request body for creating/updating subscriptions
type SubscriptionRequest struct {
	Endpoint string           `json:"endpoint" binding:"required"`
	Keys     SubscriptionKeys `json:"keys" binding:"required"`
}

// SubscriptionKeys represents the keys from the browser push subscription
type SubscriptionKeys struct {
	P256dh string `json:"p256dh" binding:"required"`
	Auth   string `json:"auth" binding:"required"`
}

// ToModel converts SubscriptionRequest to PushSubscription
func (sr *SubscriptionRequest) ToModel(userID int) *PushSubscription {
	return &PushSubscription{
		UserID:    userID,
		Endpoint:  sr.Endpoint,
		P256dhKey: sr.Keys.P256dh,
		AuthKey:   sr.Keys.Auth,
		IsActive:  true,
	}
}
