package model

import "time"

type Task struct {
	T_Id          int       `json:"t_id"`
	T_Name        string    `json:"t_name"`
	MarkCompleted bool      `json:"markCompleted"`
	Priority      int       `json:"priority"`
	Deadline      time.Time `json:"deadline"`
	W_Id          int       `json:"w_id"`
}
