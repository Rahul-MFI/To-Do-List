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
			w_name VARCHAR(255) NOT NULL,
			u_id INT NOT NULL,
			UNIQUE KEY w_name_uid (w_name, u_id),
			FOREIGN KEY (u_id) REFERENCES users(u_id) ON DELETE CASCADE
		)`,

		`CREATE TABLE IF NOT EXISTS task (
			t_id INT AUTO_INCREMENT PRIMARY KEY,
			t_name VARCHAR(255) NOT NULL,
			priority INT NOT NULL DEFAULT 1,
			markCompleted BOOLEAN DEFAULT FALSE,
			deadline DATETIME NOT NULL,
			w_id int NOT NULL,
			created_at DATETIME NOT NULL,
			UNIQUE KEY t_name_wid (t_name, w_id),
			FOREIGN KEY (w_id) REFERENCES workspace(w_id) ON DELETE CASCADE
		)`,
		`CREATE TABLE IF NOT EXISTS subscriptions (
			s_id INT AUTO_INCREMENT PRIMARY KEY,
			u_id INT NOT NULL,
			endpoint TEXT NOT NULL,
			p256dh TEXT NOT NULL,
			auth TEXT NOT NULL,
			active BOOLEAN DEFAULT TRUE NOT NULL,
			created_at TIMESTAMP NOT NULL,
			UNIQUE KEY unique_subscription (endpoint(255), p256dh(255), auth(255)),
			CONSTRAINT fk_subscription_user FOREIGN KEY (u_id) REFERENCES users(u_id) ON DELETE CASCADE
		);`,

		`CREATE TABLE IF NOT EXISTS notifications (
			n_id INT AUTO_INCREMENT PRIMARY KEY,
			t_id INT NOT NULL,
			s_id INT NOT NULL,
			duration INT NOT NULL,
			sent_at DATETIME DEFAULT NULL,
			status ENUM("sent", "failed", "pending") DEFAULT "pending",
			scheduled_at DATETIME NOT NULL,
			title VARCHAR(255) NOT NULL,
			message VARCHAR(255) NOT NULL,
			CONSTRAINT fk_task FOREIGN KEY (t_id) REFERENCES task(t_id) ON DELETE CASCADE,
			CONSTRAINT fk_subscription FOREIGN KEY (s_id) REFERENCES subscriptions(s_id) ON DELETE CASCADE,
			UNIQUE KEY uniq_notification (t_id, s_id, duration)
		);`,

		`CREATE TRIGGER IF NOT EXISTS after_task_insert
			AFTER INSERT ON task
			FOR EACH ROW
			BEGIN
				DECLARE duration1 INT DEFAULT 10; 
				DECLARE duration2 INT DEFAULT 60;
				DECLARE duration3 INT DEFAULT 180; 

				-- Insert 3 notifications for the new task
				INSERT INTO notifications(t_id, s_id, duration, scheduled_at, title, message, status)
				SELECT 
					NEW.t_id, 
					s.s_id, 
					duration1, 
					DATE_SUB(NEW.deadline, INTERVAL duration1 MINUTE), 
					"Task reminder, Rush Hour", 
					'Hurry up! You have 10 minutes to finish the task.',
					CASE
                        WHEN TIMESTAMPDIFF(MINUTE, NOW(), NEW.deadline) < duration1 THEN 'sent'
                        ELSE 'pending'
                    END
				FROM subscriptions s
				WHERE s.u_id = (SELECT w.u_id FROM workspace w WHERE w.w_id = NEW.w_id) AND s.active = TRUE;

				INSERT INTO notifications(t_id, s_id, duration, scheduled_at, title, message, status)
				SELECT 
					NEW.t_id, 
					s.s_id, 
					duration2, 
					DATE_SUB(NEW.deadline, INTERVAL duration2 MINUTE), 
					"Task reminder, Perfect Time", 
					'Great! You have 1 hour to finish the task.',
					CASE
                        WHEN TIMESTAMPDIFF(MINUTE, NOW(), NEW.deadline) < duration2 THEN 'sent'
                        ELSE 'pending'
                    END
				FROM subscriptions s
				WHERE s.u_id = (SELECT w.u_id FROM workspace w WHERE w.w_id = NEW.w_id) AND s.active = TRUE;

				INSERT INTO notifications(t_id, s_id, duration, scheduled_at, title, message, status)
				SELECT 
					NEW.t_id, 
					s.s_id, 
					duration3, 
					DATE_SUB(NEW.deadline, INTERVAL duration3 MINUTE), 
					"Task reminder, Chill", 
					'Reminder! You have 3 hours to finish the task.',
					CASE
                        WHEN TIMESTAMPDIFF(MINUTE, NOW(), NEW.deadline) < duration3 THEN 'sent'
                        ELSE 'pending'
                    END
				FROM subscriptions s
				WHERE s.u_id = (SELECT w.u_id FROM workspace w WHERE w.w_id = NEW.w_id) AND s.active = TRUE;
			END;`,

		`CREATE TRIGGER IF NOT EXISTS after_task_update
				AFTER UPDATE ON task
				FOR EACH ROW
				BEGIN
					DECLARE duration1 INT DEFAULT 10; 
					DECLARE duration2 INT DEFAULT 60;
					DECLARE duration3 INT DEFAULT 180; 

					IF NEW.deadline <> OLD.deadline THEN
						UPDATE notifications n
						SET 
							scheduled_at = DATE_SUB(NEW.deadline, INTERVAL duration1 MINUTE),
							status = CASE
								WHEN TIMESTAMPDIFF(MINUTE, NOW(), NEW.deadline) < duration1 THEN 'sent'
								ELSE 'pending'
							END
						WHERE n.t_id = NEW.t_id AND n.duration = duration1;

						UPDATE notifications n
						SET 
							scheduled_at = DATE_SUB(NEW.deadline, INTERVAL duration2 MINUTE),
							status = CASE
								WHEN TIMESTAMPDIFF(MINUTE, NOW(), NEW.deadline) < duration2 THEN 'sent'
								ELSE 'pending'
							END
						WHERE n.t_id = NEW.t_id AND n.duration = duration2;

						UPDATE notifications n
						SET 
							scheduled_at = DATE_SUB(NEW.deadline, INTERVAL duration3 MINUTE),
							status = CASE
								WHEN TIMESTAMPDIFF(MINUTE, NOW(), NEW.deadline) < duration3 THEN 'sent'
								ELSE 'pending'
							END
						WHERE n.t_id = NEW.t_id AND n.duration = duration3;
					END IF;
				END;`,

		`CREATE TRIGGER IF NOT EXISTS after_subscription_insert
			AFTER INSERT ON subscriptions
			FOR EACH ROW
			BEGIN
				DECLARE duration1 INT DEFAULT 10; 
				DECLARE duration2 INT DEFAULT 60;
				DECLARE duration3 INT DEFAULT 180; 

				-- Insert 3 notifications for the new task
				INSERT INTO notifications(t_id, s_id, duration, scheduled_at, title, message, status)
				SELECT 
					t.t_id, 
					NEW.s_id, 
					duration1, 
					DATE_SUB(t.deadline, INTERVAL duration1 MINUTE), 
					"Task reminder, Rush Hour", 
					'Hurry up! You have 10 minutes to finish the task.',
					CASE
                        WHEN TIMESTAMPDIFF(MINUTE, NOW(), t.deadline) < duration1 THEN 'sent'
                        ELSE 'pending'
                    END
				FROM task t
				WHERE NEW.u_id = (SELECT w.u_id FROM workspace w WHERE w.w_id = t.w_id) AND NEW.active = TRUE;

				INSERT INTO notifications(t_id, s_id, duration, scheduled_at, title, message, status)
				SELECT 
					t.t_id, 
					NEW.s_id, 
					duration2, 
					DATE_SUB(t.deadline, INTERVAL duration2 MINUTE), 
					"Task reminder, Rush Hour", 
					'Hurry up! You have 10 minutes to finish the task.',
					CASE
                        WHEN TIMESTAMPDIFF(MINUTE, NOW(), t.deadline) < duration2 THEN 'sent'
                        ELSE 'pending'
                    END
				FROM task t
				WHERE NEW.u_id = (SELECT w.u_id FROM workspace w WHERE w.w_id = t.w_id) AND NEW.active = TRUE;

				INSERT INTO notifications(t_id, s_id, duration, scheduled_at, title, message, status)
				SELECT 
					t.t_id, 
					NEW.s_id, 
					duration3, 
					DATE_SUB(t.deadline, INTERVAL duration3 MINUTE), 
					"Task reminder, Rush Hour", 
					'Hurry up! You have 10 minutes to finish the task.',
					CASE
                        WHEN TIMESTAMPDIFF(MINUTE, NOW(), t.deadline) < duration3 THEN 'sent'
                        ELSE 'pending'
                    END
				FROM task t
				WHERE NEW.u_id = (SELECT w.u_id FROM workspace w WHERE w.w_id = t.w_id) AND NEW.active = TRUE;
			END;`,
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
