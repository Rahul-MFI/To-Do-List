package service

import (
	"ToDo/config"
	"ToDo/model"
	"errors"
	"net/http"

	"github.com/go-sql-driver/mysql"
)

// Get all workspaces
func GetWorkspace(user_id int) (int, []model.Workspace, error) {
	res, err := config.Db.Conn.Query("SELECT * from workspace where u_id = ?", user_id)
	if err != nil {
		return http.StatusInternalServerError, nil, err
	}
	defer res.Close()
	var workspaces = []model.Workspace{}
	for res.Next() {
		var ws model.Workspace
		if err := res.Scan(&ws.W_Id, &ws.W_Name, &ws.U_Id); err != nil {
			return http.StatusInternalServerError, nil, err
		}
		workspaces = append(workspaces, ws)
	}
	if err = res.Err(); err != nil {
		return http.StatusInternalServerError, nil, err
	}
	return http.StatusOK, workspaces, nil
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
			return http.StatusInternalServerError, errors.New("internal Server Error")
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
