package utils

import (
	"testing"
)

func ValidateFields(t *testing.T, data map[string]interface{}, expected map[string]string) {
	for key, expectedType := range expected {
		value, exists := data[key]
		if !exists {
			t.Errorf("Missing field: %s", key)
			continue
		}

		switch expectedType {
		case "string":
			if _, ok := value.(string); !ok {
				t.Errorf("Field '%s' expected string, got %T", key, value)
			}
		case "number":
			if _, ok := value.(float64); !ok { // JSON numbers → float64
				t.Errorf("Field '%s' expected number, got %T", key, value)
			}
		case "bool":
			if _, ok := value.(bool); !ok {
				t.Errorf("Field '%s' expected bool, got %T", key, value)
			}
		case "array":
			if _, ok := value.([]interface{}); !ok {
				t.Errorf("Field '%s' expected array, got %T", key, value)
			}
		case "object":
			if _, ok := value.(map[string]interface{}); !ok {
				t.Errorf("Field '%s' expected object, got %T", key, value)
			}
		default:
			t.Errorf("Unknown expected type '%s' for field '%s'", expectedType, key)
		}
	}
}
