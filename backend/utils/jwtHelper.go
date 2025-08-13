package utils

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateJWT(user_id int) (string, error) {
	var JwtSecretKey = []byte(GetEnv().JWT_SECRET)

	d, err := time.ParseDuration(GetEnv().JWT_EXPIRATION)
	if err != nil {
		return "", err
	}
	claims := jwt.MapClaims{
		"user_id": user_id,
		"exp":     time.Now().Add(d).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(JwtSecretKey)
}
