package service

import (
	"ToDo/config"
	"ToDo/model"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-sql-driver/mysql"
)

type TaskResponse struct {
	T_Name        string    `json:"t_name"`
	MarkCompleted bool      `json:"markCompleted"`
	Priority      int       `json:"priority"`
	Deadline      time.Time `json:"deadline"`
	Created_At    time.Time `json:"created_at"`
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
func CreateWorkspace(w_name string, user_id int) (int, int, error) {

	result, err := config.Db.Conn.Exec("INSERT INTO workspace (w_name, u_id) values (?,?)", w_name, user_id)
	if err != nil {
		if mysqlErr, ok := err.(*mysql.MySQLError); ok {
			switch mysqlErr.Number {
			case 1062:
				return 0, http.StatusConflict, errors.New("duplicate values are not allowed")
			case 1452:
				return 0, http.StatusBadRequest, errors.New("invalid user id")
			default:
				return 0, http.StatusInternalServerError, errors.New("unknown server error")
			}
		} else {
			return 0, http.StatusInternalServerError, errors.New("internal Server Error")
		}
	}
	wid, err := result.LastInsertId()
	if err != nil {
		return 0, http.StatusInternalServerError, errors.New("failed to retrieve last insert ID")
	}
	return int(wid), http.StatusOK, nil
}

// Get all task in workspace
func GetWorkspaceTask(w_name string, u_id int, completedStr string, priorityStr string, sort string, page int, limit int, dueBeforeStr string, order string) (int, []TaskResponse, int, error) {

	wID, status, err := FindWorkspaceWithName(w_name, u_id)
	if err != nil {
		return status, nil, 0, err
	}

	var completed *bool
	var priority *int
	var dueBefore *time.Time

	if completedStr != "" {
		val := strings.ToLower(completedStr) == "true"
		completed = &val
	}

	if priorityStr != "" {
		val, err := strconv.Atoi(priorityStr)
		if err == nil {
			priority = &val
		}
	}

	if dueBeforeStr != "" {
		t, err := time.Parse(time.RFC3339, dueBeforeStr)
		if err == nil {
			dueBefore = &t
		}
	}

	query := `SELECT t_name, priority, markCompleted, deadline, created_at FROM task WHERE w_id = ? AND (markCompleted = ? OR ? is NULL) AND (priority = ? OR ? is NULL) AND (deadline <= ? OR ? is NULL)`

	query += fmt.Sprintf(` ORDER BY %s %s`, sort, order)

	if sort == "priority" || sort == "markcompleted" {
		query += fmt.Sprintf(`, %s %s`, `created_at`, `DESC`)
	}

	query += ` LIMIT ? OFFSET ?`

	res, err := config.Db.Conn.Query(
		query,
		wID, completed, completed, priority, priority, dueBefore, dueBefore, limit, (page-1)*limit,
	)
	if err != nil {
		return http.StatusInternalServerError, nil, 0, err
	}
	defer res.Close()

	var tasks []TaskResponse
	for res.Next() {
		var ts TaskResponse
		if err := res.Scan(&ts.T_Name, &ts.Priority, &ts.MarkCompleted, &ts.Deadline, &ts.Created_At); err != nil {
			return http.StatusInternalServerError, nil, 0, err
		}
		tasks = append(tasks, ts)
	}

	if err = res.Err(); err != nil {
		return http.StatusInternalServerError, nil, 0, err
	}
	var total_count int
	err = config.Db.Conn.QueryRow("SELECT COUNT(*) AS total FROM task WHERE w_id = ? AND (markCompleted = ? OR ? IS NULL) AND (priority = ? OR ? IS NULL) AND (deadline < ? OR ? IS NULL)", wID, completed, completed, priority, priority, dueBefore, dueBefore).Scan(&total_count)
	fmt.Print(err, "error sql")
	if err != nil {
		return http.StatusInternalServerError, nil, 0, err
	}
	return http.StatusOK, tasks, total_count, nil
}

// Create new task in workspace
func CreateWorkspaceTask(t_name string, priority int, deadline time.Time, w_name string, u_id int) (int, error) {

	now := time.Now().UTC()
	result, err := config.Db.Conn.Exec("INSERT INTO task (t_name, priority, deadline, created_at, w_id) VALUES (?,?,?,?, (SELECT w_id FROM workspace WHERE w_name = ? AND u_id = ?));", t_name, priority, deadline, now, w_name, u_id)
	if err != nil {
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
	var tId64 int64
	tId64, err = result.LastInsertId()
	if err != nil {
		return http.StatusInternalServerError, errors.New("failed to retrieve last insert ID")
	}
	var t_id = int(tId64)
	_, err = createSchedule(u_id, "Task reminder - 1 minute to finish", "Complete the task "+getTrimString(t_name)+" in "+getTrimString(w_name)+" workspace by ", deadline, t_id)
	if err != nil {
		return http.StatusInternalServerError, err
	}
	return http.StatusOK, nil
}

func createSchedule(u_id int, title string, message string, deadline time.Time, t_id int) (int, error) {
	scheduledFor1min := deadline.Add(-time.Duration(1) * time.Minute)
	scheduledFor10min := deadline.Add(-time.Duration(10) * time.Minute)
	scheduledFor1hour := deadline.Add(-time.Duration(60) * time.Minute)
	var err error
	_, err = config.Db.Conn.Exec("INSERT INTO table_schedule (u_id, title, message, deadline, duration, t_id) VALUES (?,?,?,?,?,?)", u_id, title, message+"1 minute.", scheduledFor1min, 1, t_id)
	if err != nil {
		return http.StatusInternalServerError, errors.New("failed to create schedule")
	}
	_, err = config.Db.Conn.Exec("INSERT INTO table_schedule (u_id, title, message, deadline, duration, t_id) VALUES (?,?,?,?,?,?)", u_id, title, message+"10 minutes.", scheduledFor10min, 10, t_id)
	if err != nil {
		return http.StatusInternalServerError, errors.New("failed to create schedule")
	}
	_, err = config.Db.Conn.Exec("INSERT INTO table_schedule (u_id, title, message, deadline, duration, t_id) VALUES (?,?,?,?,?,?)", u_id, title, message+"1 hour.", scheduledFor1hour, 60, t_id)
	if err != nil {
		return http.StatusInternalServerError, errors.New("failed to create schedule")
	}
	return http.StatusOK, nil
}

func getTrimString(s string) string {
	if len(s) > 20 {
		return s[:20] + "..."
	} else {
		return s
	}
}

func DeleteWorkspace(wid int, u_id int) (int, error) {

	status, err := FindWorkspace(wid, u_id)
	if err != nil {
		return status, err
	}
	_, err = config.Db.Conn.Exec("DELETE FROM workspace where w_id = ?", wid)
	if err != nil {
		return http.StatusInternalServerError, errors.New("internal server error")
	}
	return http.StatusOK, nil
}

func FindWorkspace(wid int, u_id int) (int, error) {
	var wID int
	err := config.Db.Conn.QueryRow(
		"SELECT w_id FROM workspace WHERE w_id = ? AND u_id = ?",
		wid, u_id,
	).Scan(&wID)

	if err == sql.ErrNoRows {
		return http.StatusNotFound, errors.New("workspace not found")
	}
	if err != nil {
		return http.StatusInternalServerError, errors.New("internal server error")
	}
	return http.StatusOK, nil
}
