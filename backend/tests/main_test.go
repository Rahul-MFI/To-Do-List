package test

import (
	"ToDo/config"
	"ToDo/utils"
	"os"
	"testing"
)

func TestMain(m *testing.M) {
	utils.LoadEnv("/Users/velmurugan.rahul/Desktop/Projects/ToDo/backend/.env.test")
	config.ConnectDatabase()
	code := m.Run()
	os.Exit(code)
}
