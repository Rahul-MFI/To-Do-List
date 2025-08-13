package service

import (
	"ToDo/config"
	"ToDo/model"
	"ToDo/utils"
	"database/sql"
	"errors"
	"fmt"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

func SignUp(email, username, password string) (string, int, error) {
	// Check if user already exists
	var userEmail string = ""
	err := config.Db.Conn.QueryRow("SELECT email FROM users WHERE email = ?", email).Scan(&userEmail)

	if err != nil {
		if err != sql.ErrNoRows {
			return "", http.StatusInternalServerError, fmt.Errorf("query error: %w", err)
		}
	} else {
		return "", http.StatusConflict, errors.New("user already exists")
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	res, err := config.Db.Conn.Exec("INSERT INTO users (email, username, password) VALUES (?, ?, ?)",
		email, username, string(hashedPassword))
	if err != nil {
		return "", http.StatusInternalServerError, err
	}
	user_id, err := res.LastInsertId()
	if err != nil {
		return "", http.StatusInternalServerError, err
	}

	token, err := utils.GenerateJWT(int(user_id))
	if err != nil {
		return "", http.StatusInternalServerError, errors.New("internal server error")
	}
	return token, http.StatusOK, nil
}

func Login(email, password string) (string, int, error) {
	var user model.Users
	err := config.Db.Conn.QueryRow("SELECT u_id, username, email, password FROM users WHERE email = ?", email).
		Scan(&user.U_Id, &user.Username, &user.Email, &user.Password)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", http.StatusNotFound, errors.New("user not found")
		}
		return "", http.StatusInternalServerError, err
	}

	// Compare password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", http.StatusUnauthorized, errors.New("invalid credentials")
	}

	// Generate JWT
	token, err := utils.GenerateJWT(user.U_Id)
	if err != nil {
		return "", http.StatusInternalServerError, errors.New("internal server error")
	}
	return token, http.StatusOK, nil
}
