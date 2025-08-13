package main

import (
	"ToDo/config"
	"ToDo/routes"
	"fmt"

	"github.com/gin-gonic/gin"
)

func routeHandler(c *gin.Context) {
	c.String(200, "Helo Rocky")
}

func main() {
	r := gin.Default()

	// Root route
	r.GET("/", routeHandler)

	// Route groups from routes package
	api := r.Group("/api")

	routes.AuthRouter(api)
	routes.WorkspaceRouter(api)
	routes.TaskRouter(api)

	fmt.Println("Server running on http://localhost:3000")
	var err error
	config.ConnectDatabase()
	if err != nil {
		fmt.Println(err)
	}
	err = config.Db.InitializeTables()
	if err != nil {
		fmt.Println(err)
	}
	err = r.Run(":3001")
	if err != nil {
		fmt.Println(fmt.Errorf("failed to create table: %w", err))
	}
}
