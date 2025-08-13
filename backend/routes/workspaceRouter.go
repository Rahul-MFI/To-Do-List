package routes

import (
	"ToDo/controller"

	"github.com/gin-gonic/gin"
)

/*
/workspace POST - create a new workspace with name
/workspace GET - return all workspaces
/workspace/:id/task POST - create a new task in the workspace
/workspace/:id/task GET - return all the tasks in the workspace
*/

func WorkspaceRouter(rg *gin.RouterGroup) {
	workspace := rg.Group("/workspace")
	workspace.GET("/", controller.GetWorkspaceController)
	workspace.POST("/", controller.CreateWorkspaceController)
	workspace.POST("/:id/task", controller.CreateWorkspaceTaskController)
	workspace.GET("/:id/task", controller.GetWorkspaceTaskController)
}
