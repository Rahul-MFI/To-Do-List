package utils

import (
	"ToDo/model"
	"log"
	"os"

	"github.com/joho/godotenv"
)

var env *model.Env

func init() {
	env = &model.Env{}
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file")
	}
	env.DB_HOST = os.Getenv("DB_HOST")
	env.DB_PORT = os.Getenv("DB_PORT")
	env.DB_USER = os.Getenv("DB_USER")
	env.DB_PASS = os.Getenv("DB_PASS")
	env.DB_NAME = os.Getenv("DB_NAME")
	env.JWT_SECRET = os.Getenv("JWT_SECRET")
	env.JWT_EXPIRATION = os.Getenv("JWT_EXPIRATION")
}

func GetEnv() model.Env {
	return *env
}
