package controller

import (
	"ToDo/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Request struct {
	Endpoint       string `json:"endpoint" binding:"required"`
	ExpirationTime string `json:"expirationTime"`
	Keys           struct {
		P256dh string `json:"p256dh" binding:"required"`
		Auth   string `json:"auth" binding:"required"`
	} `json:"keys" binding:"required"`
}

// POST /subscribe
func SubscribeController(c *gin.Context) {
	var req Request

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request"})
		return
	}

	u_id := c.GetInt("user_id")
	if status, err := service.Subscribe(req.Endpoint, req.Keys.P256dh, req.Keys.Auth, u_id); err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully subscribed user credentials for notification"})
}

// POST /unsubscribe
func UnsubscribeController(c *gin.Context) {
	var req Request
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request"})
		return
	}
	u_id := c.GetInt("user_id")
	if status, err := service.Unsubscribe(req.Endpoint, req.Keys.P256dh, req.Keys.Auth, u_id); err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Successfully deleted subscription."})
}
