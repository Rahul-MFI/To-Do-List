package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Task struct {
	Name string `json:"name"`
	Id   int    `json:"id"`
	Mark bool   `json:"mark"`
}

func healthHandlerMiddleware1(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("middleware1")
		next.ServeHTTP(w, r)
	})
}

func healthHandlerMiddleware2(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		fmt.Print("midleare 2")
		healthHandlerMiddleware1(next).ServeHTTP(w, r)
	})
}

// Main handler: dispatch based on method
func healthHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		healthHandlerGet(w, r)
	case http.MethodPost:
		healthHandlerPost(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// GET handler
func healthHandlerGet(w http.ResponseWriter, r *http.Request) {
	task := Task{
		Name: "Health Check Task",
		Id:   1,
		Mark: false,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}

// POST handler
func healthHandlerPost(w http.ResponseWriter, r *http.Request) {
	var task Task
	task.Name = "Rocky"
	task.Id = 101
	task.Mark = true

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(task)
}

func main() {
	fmt.Println("Hi Rocky")
	http.Handle("/health", healthHandlerMiddleware2(http.HandlerFunc(healthHandler)))
	http.ListenAndServe(":8080", nil)
}
