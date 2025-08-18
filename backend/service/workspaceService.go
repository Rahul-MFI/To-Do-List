package service

import (
	"ToDo/config"
	"ToDo/model"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/go-sql-driver/mysql"
)

type TaskResponse struct {
	T_Name        string    `json:"t_name"`
	MarkCompleted bool      `json:"markCompleted"`
	Priority      int       `json:"priority"`
	Deadline      time.Time `json:"deadline"`
}

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
func GetWorkspaceTask(w_name string, u_id int) (int, []TaskResponse, error) {
	// Step 1: Check if workspace exists and get w_id
	var wID int
	err := config.Db.Conn.QueryRow(
		"SELECT w_id FROM workspace WHERE w_name = ? AND u_id = ?",
		w_name, u_id,
	).Scan(&wID)

	if err == sql.ErrNoRows {
		return http.StatusNotFound, nil, fmt.Errorf("workspace not found")
	}
	if err != nil {
		return http.StatusInternalServerError, nil, err
	}

	// Step 2: Get tasks for this workspace
	res, err := config.Db.Conn.Query(
		"SELECT t_name, priority, markCompleted, deadline FROM task WHERE w_id = ?",
		wID,
	)
	if err != nil {
		return http.StatusInternalServerError, nil, err
	}
	defer res.Close()

	var tasks []TaskResponse
	for res.Next() {
		var ts TaskResponse
		if err := res.Scan(&ts.T_Name, &ts.Priority, &ts.MarkCompleted, &ts.Deadline); err != nil {
			return http.StatusInternalServerError, nil, err
		}
		tasks = append(tasks, ts)
	}

	if err = res.Err(); err != nil {
		return http.StatusInternalServerError, nil, err
	}

	return http.StatusOK, tasks, nil
}

// Create new task in workspace
func CreateWorkspaceTask(t_name string, priority int, deadline time.Time, w_name string, u_id int) (int, error) {

	if _, err := config.Db.Conn.Exec("INSERT INTO task (t_name, priority, deadline, w_id) VALUES (?,?,?, (SELECT w_id FROM workspace WHERE w_name = ? AND u_id = ?));", t_name, priority, deadline, w_name, u_id); err != nil {
		if mysqlErr, ok := err.(*mysql.MySQLError); ok {
			fmt.Print(mysqlErr.Message)
			switch mysqlErr.Number {
			case 1062:
				return http.StatusConflict, errors.New("duplicate values are not allowed")
			case 1048:
				return http.StatusBadRequest, errors.New("invalid workspace name")
			case 1452:
				return http.StatusBadRequest, errors.New("invalid workspace id")
			default:
				return http.StatusInternalServerError, errors.New("unknown server error")
			}
		} else {
			return http.StatusInternalServerError, errors.New("internal Server Error")
		}
	}
	return http.StatusOK, nil
}

func DeleteWorkspace(w_name string, u_id int) (int, error) {

	wID, status, err := FindWorkspace(w_name, u_id)
	if err != nil {
		return status, err
	}
	_, err = config.Db.Conn.Exec("DELETE FROM workspace where w_id = ?", wID)
	if err != nil {
		return http.StatusInternalServerError, errors.New("internal server error")
	}
	return http.StatusOK, nil
}

func FindWorkspace(w_name string, u_id int) (int, int, error) {
	var wID int
	err := config.Db.Conn.QueryRow(
		"SELECT w_id FROM workspace WHERE w_name = ? AND u_id = ?",
		w_name, u_id,
	).Scan(&wID)

	if err == sql.ErrNoRows {
		return 0, http.StatusNotFound, errors.New("workspace not found")
	}
	if err != nil {
		return 0, http.StatusInternalServerError, errors.New("internal server error")
	}
	return wID, http.StatusOK, nil
}
