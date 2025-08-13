package controller

import (
	"ToDo/service"
	"net/http"

	"github.com/gin-gonic/gin"
)

type CreateWorkspaceRequest struct {
	W_Name string `json:"w_name" binding:"required"`
	U_Id   int    `json:"u_id" binding:"required"`
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request. Must contain name and userId"})
		return
	}
	var status int
	var err error
	if status, err = service.CreateWorkspace(req.W_Name, req.U_Id); err != nil {
		c.JSON(status, gin.H{"error": err.Error()})
		return
	}
	c.JSON(200, gin.H{"message": "Successfully created a workspace"})
}

// POST /workspace/:id/task
func CreateWorkspaceTaskController(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "POST /workspace/:id/task"})
}

// GET /workspace/:id/task
func GetWorkspaceTaskController(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "GET /workspace/:id/task"})
}
