import httpx
import jwt
import time
import json

TEAM_ID = "DEF456TEAM"
KEY_ID = "ABC123XYZ"
BUNDLE_ID = "web.com.yourdomain.app"
PRIVATE_KEY_PATH = "AuthKey_ABC123XYZ.p8"

# Create JWT token
with open(PRIVATE_KEY_PATH, "r") as f:
    private_key = f.read()

token = jwt.encode(
    {
        "iss": TEAM_ID,
        "iat": int(time.time())
    },
    private_key,
    algorithm="ES256",
    headers={"alg": "ES256", "kid": KEY_ID}
)

device_token = "11aa01229f15f0f0c52029f5b6748d7711d0b8dfdfb2e1f034312f4..."

payload = {
    "aps": {
        "alert": "Push from Python to Safari PWA 🚀",
        "sound": "default"
    }
}

headers = {
    "authorization": f"bearer {token}",
    "apns-topic": BUNDLE_ID,
    "apns-push-type": "alert",
    "content-type": "application/json"
}

url = f"https://api.push.apple.com/3/device/{device_token}"

response = httpx.post(url, headers=headers, json=payload, http2=True)
print(response.status_code, response.text)
