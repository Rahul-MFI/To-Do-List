package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// PUT /tasks/:id
func UpdateTaskController(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "PUT /tasks/:id"})
}

// PATCH /tasks/:id/complete
func MarkTaskCompletedController(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "PATCH /tasks/:id/complete"})
}

// DELETE /tasks/:id
func DeleteTaskController(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "DELETE /tasks/:id"})
}
