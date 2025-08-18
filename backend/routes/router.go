package routes

import (
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()
	api := r.Group("/api")

	AuthRouter(api)
	WorkspaceRouter(api)
	TaskRouter(api)

	return r
}
