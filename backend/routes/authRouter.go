package routes

import (
	"ToDo/controller"

	"github.com/gin-gonic/gin"
)

func AuthRouter(rg *gin.RouterGroup) {
	auth := rg.Group("/auth")
	auth.POST("/login", controller.LoginController)
	auth.POST("/signup", controller.SignupController)
	auth.GET("/verify", controller.VerifyController)
	auth.GET("/profile", controller.ProfileController)
}
