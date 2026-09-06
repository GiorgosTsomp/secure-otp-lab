import requests

BASE_URL = "http://localhost:3000"
PHONE = "+306900000100"
REQUEST_COUNT = 20

successful_requests = 0

print(f"Sending {REQUEST_COUNT} OTP requests...\n")

for attempt in range(1, REQUEST_COUNT + 1):
    response = requests.post(
        f"{BASE_URL}/otp/request",
        json={
            "phone": PHONE
        }
    )

    print(
        f"Request #{attempt}: "
        f"HTTP {response.status_code}"
    )

    if response.status_code == 201:
        successful_requests += 1

print("\nAttack summary")
print("----------------")
print(f"Requests sent: {REQUEST_COUNT}")
print(f"Requests accepted: {successful_requests}")