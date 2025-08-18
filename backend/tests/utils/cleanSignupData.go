package utils

import "ToDo/config"

type DeleteData struct {
	Email string `json:"email"`
}

func DeleteUsers() {
	var deleteData = []DeleteData{
		{Email: "abcdef@gmail.com"},
		{Email: "defghi@gmail.com"},
	}
	for _, data := range deleteData {
		_, err := config.Db.Conn.Exec("DELETE FROM users WHERE email = ?", data.Email)
		if err != nil {
			return
		}
	}
}
