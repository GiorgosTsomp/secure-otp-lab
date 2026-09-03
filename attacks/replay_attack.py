import requests

BASE_URL = "http://localhost:3000"

phone = "+306900000001"

otp = input("Enter the OTP received from the mock SMS service: ")

payload = {
    "phone": phone,
    "otp": otp
}

print("\nFirst verification:")

response = requests.post(
    f"{BASE_URL}/otp/verify",
    json=payload
)

print(response.status_code)
print(response.json())

print("\nReplaying the exact same OTP:")

response = requests.post(
    f"{BASE_URL}/otp/verify",
    json=payload
)

print(response.status_code)
print(response.json())