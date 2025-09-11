package controller

import (
	"ToDo/service"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type UpdateTaskRequest struct {
	T_Name         string    `json:"t_name"           binding:"required"`
	W_Name         string    `json:"w_name"           binding:"required"`
	T_Name_Updated string    `json:"t_name_updated"   binding:"required"`
	Priority       int       `json:"priority"         binding:"required"`
	Deadline       time.Time `json:"deadline"         binding:"required"`
}

type MarkCompletedRequest struct {
	T_Name        string `json:"t_name"           binding:"required"`
	W_Name        string `json:"w_name"           binding:"required"`
	MarkCompleted *bool  `json:"markCompleted"    binding:"required"`
}

type DeleteTaskRequest struct {
	T_Name string `json:"t_name"           binding:"required"`
	W_Name string `json:"w_name"           binding:"required"`
}

// PUT /tasks/
func UpdateTaskController(c *gin.Context) {
	var req UpdateTaskRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request"})
		return
	}
	now := time.Now().UTC()

	if req.T_Name == "" || req.W_Name == "" || req.T_Name_Updated == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request"})
		return
	}

	if req.Deadline.UTC().Before(now) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deadline must be in the future"})
		return
	}

	if req.Priority < 1 || req.Priority > 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Priority must be between 1 and 3"})
		return
	}

	u_id := c.GetInt("user_id")
	if status, err := service.UpdateTask(req.T_Name, req.W_Name, req.T_Name_Updated, req.Deadline, req.Priority, u_id); err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully get request"})

}

// PATCH /tasks/
func MarkTaskCompletedController(c *gin.Context) {

	var req MarkCompletedRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	u_id := c.GetInt("user_id")
	status, err := service.MarkTaskCompleted(req.T_Name, req.W_Name, *req.MarkCompleted, u_id)
	if err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Successfully mark completed task"})
}

// DELETE /tasks/
func DeleteTaskController(c *gin.Context) {

	var req DeleteTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request"})
		return
	}

	u_id := c.GetInt("user_id")
	status, err := service.DeleteTask(req.W_Name, req.T_Name, u_id)
	if err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully deleted task"})
}
