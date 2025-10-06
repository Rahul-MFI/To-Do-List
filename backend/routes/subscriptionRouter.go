package routes

import (
	"ToDo/controller"
	"ToDo/middleware"

	"github.com/gin-gonic/gin"
)

/*
/subscribe POST - create subscription
/unsubscribe - POST - delete subscription
*/

func SubscriptionRouter(rg *gin.RouterGroup) {
	rg.Use(middleware.AuthMiddleware())
	rg.POST("/subscribe", controller.SubscribeController)
	rg.POST("/unsubscribe", controller.UnsubscribeController)
}
