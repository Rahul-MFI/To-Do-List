package utils

import (
	"encoding/json"
	"os"
	"testing"
)

// Load test cases from JSON file
func LoadTestCases[T any](t *testing.T, fileName string) []T {
	filePath := "/Users/velmurugan.rahul/Desktop/Projects/ToDo/backend/utils/"
	filePath += fileName
	data, err := os.ReadFile(filePath)
	if err != nil {
		t.Fatalf("Failed to read testcases.json: %v", err)
	}

	var cases []T
	if err := json.Unmarshal(data, &cases); err != nil {
		t.Fatalf("Failed to unmarshal test cases: %v", err)
	}
	return cases
}
