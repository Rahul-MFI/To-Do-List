package service

import (
	"ToDo/config"
	"database/sql"
	"errors"
	"net/http"
	"time"
)

// Update task
func UpdateTask(t_name string, w_name string, t_name_updated string, deadline time.Time, priority int, u_id int) (int, error) {
	var w_id, status int
	var err error
	if w_id, status, err = FindWorkspaceWithName(w_name, u_id); err != nil {
		return status, err
	}
	if t_name != t_name_updated {
		_, status, _ = FindTask(t_name_updated, w_id)
		if status == 200 {
			return 400, errors.New("task is already there")
		}
	}
	var t_id int
	if t_id, status, err = FindTask(t_name, w_id); err != nil {
		return status, err
	}

	_, err = config.Db.Conn.Exec("UPDATE task SET t_name = ?, deadline = ?, priority = ? WHERE t_id = ?", t_name_updated, deadline, priority, t_id)
	if err != nil {
		return 500, errors.New("mysql server error")
	}
	return http.StatusOK, nil
}

// Mark task completed
func MarkTaskCompleted(t_name string, w_name string, markCompleted bool, u_id int) (int, error) {

	var w_id, status int
	var err error
	if w_id, status, err = FindWorkspaceWithName(w_name, u_id); err != nil {
		return status, err
	}

	var t_id int
	if t_id, status, err = FindTask(t_name, w_id); err != nil {
		return status, err
	}

	_, err = config.Db.Conn.Exec("UPDATE task SET markCompleted = ? where t_id = ?", markCompleted, t_id)
	if err != nil {
		return http.StatusInternalServerError, errors.New("internal server error")
	}
	return http.StatusOK, nil
}

// Delete a task
func DeleteTask(w_name string, t_name string, u_id int) (int, error) {

	var w_id, status int
	var err error
	if w_id, status, err = FindWorkspaceWithName(w_name, u_id); err != nil {
		return status, err
	}

	var t_id int
	if t_id, status, err = FindTask(t_name, w_id); err != nil {
		return status, err
	}

	_, err = config.Db.Conn.Exec("DELETE FROM task WHERE t_id = ?", t_id)
	if err != nil {
		return http.StatusInternalServerError, errors.New("internal server error")
	}
	return http.StatusOK, nil
}

func FindTask(t_name string, w_id int) (int, int, error) {
	var tID int
	err := config.Db.Conn.QueryRow(
		"SELECT t_id FROM task WHERE t_name = ? AND w_id = ?",
		t_name, w_id,
	).Scan(&tID)

	if err == sql.ErrNoRows {
		return 0, http.StatusNotFound, errors.New("task not found")
	}
	if err != nil {
		return 0, http.StatusInternalServerError, errors.New("internal server error")
	}
	return tID, http.StatusOK, nil
}

func FindWorkspaceWithName(w_name string, u_id int) (int, int, error) {
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
