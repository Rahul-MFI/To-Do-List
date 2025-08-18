package main

import (
	"ToDo/config"
	"ToDo/routes"
	"ToDo/utils"
	"fmt"

	"github.com/gin-gonic/gin"
)

func routeHandler(c *gin.Context) {
	c.String(200, "Helo Rocky")
}

func main() {
	utils.LoadEnv(".env.test")
	_ = utils.GetEnv()

	r := routes.SetupRouter()
	r.GET("/", routeHandler)

	fmt.Println("Server running on http://localhost:3001")
	var err error
	config.ConnectDatabase()

	err = config.Db.InitializeTables()
	if err != nil {
		fmt.Println(err)
	}
	err = r.Run(":3001")
	if err != nil {
		fmt.Println(fmt.Errorf("failed to create table: %w", err))
	}
}
