package utils

import (
	"ToDo/model"
	"log"
	"os"

	"github.com/joho/godotenv"
)

var env *model.Env

// LoadEnv loads env vars from a given file
func LoadEnv(file string) {
	env = &model.Env{}
	if _, err := os.Stat(".env"); err == nil {
		err := godotenv.Load(".env")
		if err != nil {
			log.Println("Warning: Failed to load .env file:", err)
		}
	}
	env.DB_HOST = os.Getenv("DB_HOST")
	env.DB_PORT = os.Getenv("DB_PORT")
	if env.DB_PORT == "" || env.DB_PORT == "0" {
		env.DB_PORT = "3306"
	}
	env.DB_USER = os.Getenv("DB_USER")
	env.DB_PASS = os.Getenv("DB_PASS")
	env.DB_NAME = os.Getenv("DB_NAME")
	env.JWT_SECRET = os.Getenv("JWT_SECRET")
	env.JWT_EXPIRATION = os.Getenv("JWT_EXPIRATION")
}

// GetEnv returns the loaded env
func GetEnv() model.Env {
	if env == nil {
		log.Fatal("Environment not loaded. Call LoadEnv first.")
	}
	return *env
}
