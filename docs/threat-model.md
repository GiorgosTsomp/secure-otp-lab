# Threat Model

## 1. System Overview

Secure OTP Lab is a local application security project that demonstrates
the design, weaknesses, exploitation, and hardening of an OTP-based
verification system.

The application exposes two main endpoints:

- `POST /otp/request`
- `POST /otp/verify`

OTP delivery is simulated through a mock SMS service that prints the
verification message to the local terminal.

No real SMS provider, real phone numbers, or external infrastructure are
used.

---

## 2. Architecture

```text
Client / Test Script
        |
        | HTTP
        v
   Express API
        |
        v
    OTP Service
      /     \
     v       v
 SQLite    Mock SMS
Database   Service
              |
              v
           Terminal

---

## 3. Assets

The main assets that the system should protect are:

OTP values
User verification state
OTP challenge integrity
User identifiers such as phone numbers
Availability of the OTP request and verification endpoints
Authentication flow integrity

Compromise of these assets could allow an attacker to bypass verification, reuse authentication codes, abuse the delivery mechanism, or deny service to legitimate users.

---

## 4. Entry Points

The main externally accessible entry points are:

OTP Request

POST /otp/request

Accepts a phone number and creates a new OTP challenge.

OTP Verification

POST /otp/verify

Accepts a phone number and OTP and determines whether the submitted code matches a stored challenge.

These endpoints represent the primary attack surface of the current lab.

---

## 5. Trust Boundaries

The system contains several trust boundaries:

Untrusted Client
      |
      | HTTP requests
      v
-------------------------
      Express API
-------------------------
      |
      v
  Application Logic
      |
      v
-------------------------
   SQLite Database
-------------------------

Input received from the client must be considered untrusted.

The application must not assume that requests come from a legitimate user or from the intended client.

An attacker may interact directly with the HTTP endpoints using automated tools instead of following the intended application flow.

---

## 6. Attacker Model

For this lab, the attacker is assumed to be able to:

Send arbitrary HTTP requests to the OTP endpoints
Automate large numbers of requests
Modify request parameters
Submit arbitrary OTP guesses
Replay previously obtained valid OTPs
Request multiple OTPs for the same identifier
Observe normal API responses and HTTP status codes

Some scenarios may additionally assume that an attacker obtains access to a copy of the database in order to evaluate the impact of insecure OTP storage.

The attacker is not assumed to control the server operating system or application source code during normal remote attack scenarios.

---

## 7. Security Goals

A hardened OTP implementation should eventually enforce the following properties:

OTPs should be generated using a cryptographically secure random source.
OTPs should have a short lifetime.
OTPs should be usable only once.
Verification attempts should be limited.
OTP requests should be rate limited.
Previous OTPs should be invalidated when appropriate.
OTP values should not be stored unnecessarily in plaintext.
OTPs should be bound to the correct user and challenge.
OTPs should be bound to their intended authentication purpose.
Automated abuse should be constrained.
Sensitive OTP values should not appear in production logs.

---

## 8. Out of Scope

The following areas are intentionally outside the scope of this project:

Real SMS provider security
Telecommunications infrastructure
SIM swapping
SS7 attacks
Real user accounts
Production deployment
Cloud infrastructure
Real payment or SMS costs
Malware on the user's device

The focus of this project is the security of the OTP application logic itself.

---

## 9. Testing Scope

All attack demonstrations included in this repository target only the local application running on:

http://localhost:3000

The attack scripts are proof-of-concept tests used to demonstrate and validate weaknesses in the intentionally vulnerable implementation.


