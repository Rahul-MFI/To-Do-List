package config

import (
	"database/sql"
	"fmt"
	"log"
	"notificationService/utils"

	_ "github.com/go-sql-driver/mysql"
)

// DB struct wraps the *sql.DB connection.
type DB struct {
	Conn *sql.DB
}

type Config struct {
	Host     string
	Port     string
	Username string
	Password string
	Database string
}

var Db *DB

func (db *DB) Close() error {
	return db.Conn.Close()
}

// ConnectDatabase creates and returns a DB struct
func ConnectDatabase() error {
	Db = &DB{}
	cfg := Config{
		Host:     utils.GetEnv().DB_HOST,
		Port:     utils.GetEnv().DB_PORT,
		Username: utils.GetEnv().DB_USER,
		Password: utils.GetEnv().DB_PASS,
		Database: utils.GetEnv().DB_NAME,
	}
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4",
		cfg.Username,
		cfg.Password,
		cfg.Host,
		cfg.Port,
		cfg.Database,
	)
	var err error
	Db.Conn, err = sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	Db.Conn.SetMaxOpenConns(25)
	Db.Conn.SetMaxIdleConns(25)

	if err := Db.Conn.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}
	log.Println("Notification service database connected successfully")
	return nil
}
