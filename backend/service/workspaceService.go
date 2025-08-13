package service

import (
	"ToDo/config"
	"errors"
	"net/http"

	"github.com/go-sql-driver/mysql"
)

// Get all workspaces
func GetWorkspace() {

}

// Create new workspace
func CreateWorkspace(w_name string, user_id int) (int, error) {

	_, err := config.Db.Conn.Exec("INSERT INTO workspace (w_name, u_id) values (?,?)", w_name, user_id)
	if err != nil {
		if mysqlErr, ok := err.(*mysql.MySQLError); ok {
			switch mysqlErr.Number {
			case 1062:
				return http.StatusConflict, errors.New("duplicate values are not allowed")
			case 1452:
				return http.StatusBadRequest, errors.New("invalid user id")
			default:
				return http.StatusInternalServerError, errors.New("unknown server error")
			}
		} else {
			return 500, errors.New("internal Server Error")
		}
	}
	return http.StatusOK, nil
}

// Get all task in workspace
func GetWorkspaceTask() {

}

// Create new task in workspace
func CreateWorkspaceTask() {

}
