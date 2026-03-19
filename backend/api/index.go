package handler

import (
	"ToDo/config"
	"ToDo/routes"
	"ToDo/utils"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

var (
	app     *gin.Engine
	initErr error
)

func init() {
	utils.LoadEnv(".env")
	_ = utils.GetEnv()

	if err := config.ConnectDatabase(); err != nil {
		log.Println("Warning: failed to connect to database:", err)
		initErr = err
		return
	}

	if err := config.Db.InitializeTables(); err != nil {
		log.Println("Warning: failed to initialize tables:", err)
	}

	app = routes.SetupRouter()
	app.GET("/", func(c *gin.Context) {
		c.String(200, "Helo Rocky")
	})
}

func setCORSHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
	w.Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
	w.Header().Set("Access-Control-Expose-Headers", "Content-Length")
}

// Handler is the single entry point Vercel calls
func Handler(w http.ResponseWriter, r *http.Request) {
	setCORSHeaders(w)

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if initErr != nil || app == nil {
		http.Error(w, "Service unavailable: database connection failed", http.StatusServiceUnavailable)
		return
	}
	app.ServeHTTP(w, r)
}
