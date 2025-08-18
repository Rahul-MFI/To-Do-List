package controller

import (
	"ToDo/service"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type CreateWorkspaceRequest struct {
	W_Name string `json:"w_name" binding:"required"`
}

type CreateWorkspaceTaskRequest struct {
	T_Name   string    `json:"t_name" binding:"required"`
	Priority int       `json:"priority" binding:"required"`
	Deadline time.Time `json:"deadline" binding:"required"`
	W_Name   string    `json:"w_name" binding:"required"`
}

// GET /workspace
func GetWorkspaceController(c *gin.Context) {
	user_id := c.GetInt("user_id")
	status, workspaces, err := service.GetWorkspace(user_id)
	if err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Successfully fetched the data", "data": workspaces})
}

// POST /workspace
func CreateWorkspaceController(c *gin.Context) {
	var req CreateWorkspaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request. Must contain workspace name"})
		return
	}

	u_id := c.GetInt("user_id")

	if status, err := service.CreateWorkspace(req.W_Name, u_id); err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Successfully created a workspace"})
}

// POST /workspace/task
func CreateWorkspaceTaskController(c *gin.Context) {
	var req CreateWorkspaceTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Must contain name, priority and deadline"})
		return
	}
	now := time.Now()
	if req.T_Name == "" || (req.Priority < 1 || req.Priority > 3) || req.Deadline.UTC().Before(now.UTC()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request"})
		return
	}

	u_id := c.GetInt("user_id")

	status, err := service.CreateWorkspaceTask(req.T_Name, req.Priority, req.Deadline, req.W_Name, u_id)
	if err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Successfully Created Task"})
}

// GET /workspace/task?w_name=""
func GetWorkspaceTaskController(c *gin.Context) {
	w_name := c.Query("w_name")
	if w_name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	u_id := c.GetInt("user_id")

	status, tasks, err := service.GetWorkspaceTask(w_name, u_id)
	if err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully get task in workspace", "tasks": tasks})
}

// DELETE /workspace?w_name=""
func DeleteWorkspaceController(c *gin.Context) {
	w_name := c.Query("w_name")
	if w_name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request"})
		return
	}
	u_id := c.GetInt("user_id")
	status, err := service.DeleteWorkspace(w_name, u_id)
	if err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Successfully deleted."})
}
