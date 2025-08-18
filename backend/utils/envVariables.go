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
	err := godotenv.Load(file)
	if err != nil {
		log.Fatalf("Error loading %s file: %v", file, err)
	}
	env.DB_HOST = os.Getenv("DB_HOST")
	env.DB_PORT = os.Getenv("DB_PORT")
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
