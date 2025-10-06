package middleware

import (
	"errors"
	"net/http"
	"notificationService/utils"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func VerifyToken(authHeader string, secret string) (int, error) {
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		return 0, errors.New("authorization header missing or invalid")
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")

	// Parse & validate token
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	})

	if err != nil || !token.Valid {
		return 0, errors.New("invalid token")
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok {
		if userID, ok := claims["user_id"].(float64); ok && userID > 0 {
			return int(userID), nil
		}
		return 0, errors.New("invalid token payload")
	}

	return 0, errors.New("unable to parse claims")
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Check content type
		if c.Request.Method == http.MethodPost ||
			c.Request.Method == http.MethodPut ||
			c.Request.Method == http.MethodPatch {

			if c.GetHeader("Content-Type") != "application/json" {
				c.JSON(http.StatusUnsupportedMediaType, gin.H{
					"error": "Content-Type must be application/json",
				})
				c.Abort()
				return
			}
		}

		authHeader := c.GetHeader("Authorization")
		userID, err := VerifyToken(authHeader, utils.GetEnv().JWT_SECRET)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			c.Abort()
			return
		}

		c.Set("user_id", userID)
		c.Next()
	}
}
