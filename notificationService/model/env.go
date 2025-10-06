package model

type Env struct {
	DB_HOST           string
	DB_PORT           string
	DB_USER           string
	DB_PASS           string
	DB_NAME           string
	PORT              string
	JWT_SECRET        string
	JWT_EXPIRATION    string
	VAPID_PUBLIC_KEY  string
	VAPID_PRIVATE_KEY string
}
