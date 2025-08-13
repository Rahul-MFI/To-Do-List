package config

import (
	"ToDo/utils"
	"database/sql"
	"fmt"
	"log"

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

// InitializeTables creates tables if they don't exist
func (db *DB) InitializeTables() error {
	tables := []string{
		`CREATE TABLE IF NOT EXISTS users (
			u_id INT AUTO_INCREMENT PRIMARY KEY,
			username VARCHAR(50) NOT NULL,
			email VARCHAR(100) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL
		)`,

		`CREATE TABLE IF NOT EXISTS workspace (
			w_id INT AUTO_INCREMENT PRIMARY KEY,
			w_name VARCHAR(255) NOT NULL UNIQUE,
			u_id INT NOT NULL,
			FOREIGN KEY (u_id) REFERENCES users(u_id) ON DELETE CASCADE
		)`,

		`CREATE TABLE IF NOT EXISTS task (
			t_id INT AUTO_INCREMENT PRIMARY KEY,
			t_name VARCHAR(255) NOT NULL,
			priority INT NOT NULL DEFAULT 1,
			markCompleted BOOLEAN DEFAULT FALSE,
			deadline DATETIME NOT NULL,
			w_id int NOT NULL,
			FOREIGN KEY (w_id) REFERENCES workspace(w_id) ON DELETE CASCADE
		)`,
	}

	for _, table := range tables {
		if _, err := db.Conn.Exec(table); err != nil {
			return fmt.Errorf("failed to create table: %w", err)
		}
	}

	log.Println("All tables created successfully")
	return nil
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
	log.Println("Database connected successfully")
	return nil
}
