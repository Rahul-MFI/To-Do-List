package controller

import (
	"ToDo/service"
	"net/http"
	"strconv"
	"strings"
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
	if req.T_Name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad Request"})
		return
	}

	if req.Priority < 1 || req.Priority > 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Priority must be between 1 and 3"})
		return
	}

	if req.Deadline.UTC().Before(now.UTC()) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Deadline must be after current time"})
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

	completed := c.Query("completed")
	if completed != "" {
		lc := strings.ToLower(completed)
		if lc != "true" && lc != "false" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid completed parameter, must be true or false"})
			return
		}
	}
	completed = strings.ToLower(completed)

	priorityStr := c.Query("priority")
	if priorityStr != "" {
		val, err := strconv.Atoi(priorityStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid priority parameter, must be a number"})
			return
		}
		if val < 1 || val > 3 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid priority parameter, must be between 1 and 3"})
			return
		}
	}

	sort := c.DefaultQuery("sort", "created_at")
	if strings.ToLower(sort) != "priority" && strings.ToLower(sort) != "deadline" && sort != "created_at" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sort parameter"})
		return
	}
	sort = strings.ToLower(sort)

	order := c.DefaultQuery("order", "ASC")
	if strings.ToUpper(order) != "DESC" && strings.ToUpper(order) != "ASC" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid order parameter"})
		return
	}
	order = strings.ToUpper(order)

	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page parameter"})
		return
	}

	limit, err := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
		return
	}

	dueBefore := c.Query("due_before")
	if dueBefore != "" {
		_, err := time.Parse(time.RFC3339, dueBefore)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid due_before format, must be RFC3339"})
			return
		}
	}

	status, tasks, err := service.GetWorkspaceTask(w_name, u_id, completed, priorityStr, sort, page, limit, dueBefore, order)
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
