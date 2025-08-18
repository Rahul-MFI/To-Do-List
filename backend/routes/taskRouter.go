package routes

import (
	"ToDo/controller"
	"ToDo/middleware"

	"github.com/gin-gonic/gin"
)

/*
/tasks PUT - update the task
/tasks/complete - PATCH - mark as complete
/tasks/ DELETE - Delete the task
*/

func TaskRouter(rg *gin.RouterGroup) {
	task := rg.Group("/tasks")
	task.Use(middleware.AuthMiddleware())
	task.PUT("/", controller.UpdateTaskController)
	task.PATCH("/", controller.MarkTaskCompletedController)
	task.DELETE("/", controller.DeleteTaskController)
}
