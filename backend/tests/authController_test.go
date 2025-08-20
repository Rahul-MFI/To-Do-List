package test

import (
	"ToDo/tests/utils"
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"testing"
)

// Struct for test cases from JSON
type LoginTestCase struct {
	Name            string                 `json:"name"`
	Payload         map[string]interface{} `json:"payload"`
	ExpectedStatus  int                    `json:"expectedStatus"`
	ExpectedMessage map[string]string      `json:"expectedMessage"`
}

func TestLoginWithRunningServer(t *testing.T) {
	testCases := utils.LoadTestCases[LoginTestCase](t, "login_testcase.json")

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			body, _ := json.Marshal(tc.Payload)

			// Send actual HTTP request to localhost:3000
			resp, err := http.Post("http://localhost:3001/api/auth/login", "application/json", bytes.NewBuffer(body))
			if err != nil {
				t.Fatalf("Failed to send request: %v", err)
			}
			defer resp.Body.Close()

			respBody, _ := io.ReadAll(resp.Body)
			var result map[string]interface{}

			if resp.StatusCode != tc.ExpectedStatus {
				t.Errorf("Test %s failed: expected %d, got %d\nResponse body: %s",
					tc.Name, tc.ExpectedStatus, resp.StatusCode, string(respBody))
			}

			if err := json.Unmarshal(respBody, &result); err != nil {
				t.Fatalf("Invalid JSON response: %v\nBody: %s", err, string(respBody))
			}

			utils.ValidateFields(t, result, tc.ExpectedMessage)
		})
	}
}

// Struct for test cases from JSON
type SignUpTestCase struct {
	Name            string                 `json:"name"`
	Payload         map[string]interface{} `json:"payload"`
	ExpectedStatus  int                    `json:"expectedStatus"`
	ExpectedMessage map[string]string      `json:"expectedMessage"`
}

func TestSignUpWithRunningServer(t *testing.T) {
	testCases := utils.LoadTestCases[SignUpTestCase](t, "signup_testcase.json")

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			body, _ := json.Marshal(tc.Payload)

			// Send actual HTTP request to localhost:3000
			resp, err := http.Post("http://localhost:3001/api/auth/signup", "application/json", bytes.NewBuffer(body))
			if err != nil {
				t.Fatalf("Failed to send request: %v", err)
			}
			defer resp.Body.Close()

			respBody, _ := io.ReadAll(resp.Body)
			var result map[string]interface{}

			if resp.StatusCode != tc.ExpectedStatus {
				t.Errorf("Test %s failed: expected %d, got %d\nResponse body: %s",
					tc.Name, tc.ExpectedStatus, resp.StatusCode, string(respBody))
			}

			if err := json.Unmarshal(respBody, &result); err != nil {
				t.Fatalf("Invalid JSON response: %v\nBody: %s", err, string(respBody))
			}

			utils.ValidateFields(t, result, tc.ExpectedMessage)
		})
	}

	utils.DeleteUsers()
}
