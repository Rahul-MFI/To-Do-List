package routes

import (
	"ToDo/controller"

	"github.com/gin-gonic/gin"
)

/*
/tasks/:id PUT - update the task
/tasks/:id/complete - PATCH - mark as complete
/tasks/:id DELETE - Delete the task
*/

func TaskRouter(rg *gin.RouterGroup) {
	task := rg.Group("/tasks")
	task.PUT("/:id", controller.UpdateTaskController)
	task.PATCH("/:id/complete", controller.MarkTaskCompletedController)
	task.DELETE("/:id", controller.DeleteTaskController)
}
