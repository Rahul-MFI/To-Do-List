package handler

import (
	"ToDo/config"
	"ToDo/routes"
	"ToDo/utils"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
)

var (
	app  *gin.Engine
	once sync.Once
)

func init() {
	once.Do(func() {
		// Load env and setup
		utils.LoadEnv(".env")
		_ = utils.GetEnv()

		// Connect to TiDB database
		config.ConnectDatabase()

		// Initialize tables
		err := config.Db.InitializeTables()
		if err != nil {
			panic(err)
		}

		// Setup Gin router
		app = routes.SetupRouter()

		// Root route
		app.GET("/", func(c *gin.Context) {
			c.String(200, "Helo Rocky")
		})
	})
}

// Handler is the single entry point Vercel calls
func Handler(w http.ResponseWriter, r *http.Request) {
	app.ServeHTTP(w, r)
}
