package model

type Users struct {
	U_Id     int    `json:"u_id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}
