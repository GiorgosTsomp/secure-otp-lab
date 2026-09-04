# Vulnerability Analysis

This document tracks security weaknesses identified in the intentionally naive OTP implementation.

The initial implementation is designed to function correctly while omitting several important security controls. These weaknesses are then tested and addressed during later hardening stages.

---

## V-01: OTP Replay

**Status:** Mitigated

**Severity:** High

### Description

A successfully verified OTP remains valid after its first use.

The application checks whether a matching OTP exists in the database but does not mark the challenge as consumed or delete it.

### Vulnerable Behavior

```text
OTP: 583214

Verification #1 -> SUCCESS
Verification #2 -> SUCCESS
Verification #3 -> SUCCESS
Root Cause

The current database schema contains no state indicating whether an OTP has already been used.

The verification logic performs only a lookup:

phone + OTP -> matching record -> success
Proof of Concept
attacks/replay_attack.py

The script submits a valid OTP and then immediately sends the exact same verification request again.

Both requests are accepted.

### Mitigation

OTP challenges now include a `used_at` state.

After successful verification, the challenge is atomically marked as consumed. Future verification attempts require `used_at` to remain `NULL`, preventing the same OTP from being accepted again.

The existing replay proof-of-concept was executed again after the mitigation. The first verification succeeds, while replaying the same OTP is rejected.

### Expected Secure Behavior

After the first successful verification, the OTP should become permanently invalid.

---

## V-02: Unlimited OTP Guessing

Status: Mitigated

Severity: High

### Description

The OTP verification endpoint allows an unlimited number of incorrect verification attempts.

An attacker can repeatedly submit OTP guesses until a valid value is found.

### Root Cause

The current implementation has no:

Per-challenge attempt counter
Account-level attempt limit
Verification rate limiting
Progressive delay
Proof of Concept
attacks/brute_force.py

For practical local testing, the OTP length can temporarily be reduced to four digits.

The attack script automatically submits possible OTP values until the server returns a successful verification response.

### Mitigation

Each OTP challenge now tracks failed verification attempts.

The verification endpoint requires a specific `challengeId`, and failed
attempts increment the counter for that challenge.

Once `OTP_MAX_ATTEMPTS` is reached, the challenge is permanently rejected,
including when the correct OTP is subsequently submitted.

The existing brute-force proof-of-concept can no longer continue guessing
until a valid OTP is found.

### Expected Secure Behavior

A challenge should stop accepting verification attempts after a small number of failures.

Additional rate limiting should restrict automated request volume.

---

## V-03: Weak OTP Generation

Status: Mitigated

Severity: High

### Description

The naive implementation generates OTP values using:

Math.random()

Math.random() is not intended for generating authentication secrets.

### Root Cause

The implementation uses a general-purpose pseudo-random number generator instead of a cryptographically secure random number generator.

### Mitigation

The OTP generator was changed from `Math.random()` to Node.js
`crypto.randomInt()`, which provides cryptographically secure random
number generation suitable for security-sensitive values.

### Expected Secure Behavior

OTP generation should use a cryptographically secure source of randomness.

In Node.js, this can be implemented using the crypto module.

---

## V-04: Plaintext OTP Storage

Status: Identified

Severity: High

### Description

OTP values are stored directly in the SQLite database.

Example:

phone             otp
-------------------------
+306900000001     482193

If the database is exposed, active OTP values can be immediately read.

### Root Cause

The naive database schema stores the OTP value directly.

### Expected Secure Behavior

The application should avoid storing directly usable OTP secrets whenever possible.

The project will later evaluate an appropriate keyed digest strategy and the limitations created by the small OTP keyspace.

---

## V-05: No OTP Expiration Enforcement

Status: Mitigated

Severity: High

### Description

The project configuration contains:

OTP_EXPIRY_SECONDS=300

but the application never checks this value during verification.

As a result, an OTP remains valid regardless of its age.

### Root Cause

The database stores created_at, but verification does not compare it against an expiration time.

### Mitigation

OTP verification now enforces the configured expiration window using the
challenge creation timestamp.

The application reads `OTP_EXPIRY_SECONDS` from the environment and rejects
OTP challenges created before the allowed validity window.

### Expected Secure Behavior

OTP challenges should have a short validity period and expired challenges must always be rejected.

---

## V-06: Multiple Active OTPs

Status: Identified

Severity: Medium

### Description

A user can request multiple OTPs and every generated OTP remains stored and valid.

Example:

Request #1 -> 583214
Request #2 -> 741823

583214 -> VALID
741823 -> VALID
Root Cause

Creating a new OTP does not invalidate previous challenges associated with the same user.

### Expected Secure Behavior

The system should define a clear policy for new OTP requests and invalidate older challenges when required.

---

## V-07: No OTP Request Rate Limiting

Status: Identified

Severity: High

### Description

The /otp/request endpoint currently accepts repeated requests without restriction.

An automated client could continuously request new OTP challenges.

### Potential Impact

In a real system this could cause:

SMS or email flooding
Resource exhaustion
Provider cost abuse
User harassment
Denial of service
Expected Secure Behavior

Request frequency should be restricted using multiple controls such as per-user and per-source limits.

---

## V-08: Weak Input Validation

Status: Identified

Severity: Low

### Description

The application currently checks only whether the phone field exists.

Values such as:

{
  "phone": "hello"
}

may therefore be accepted.

### Expected Secure Behavior

User identifiers should be validated and normalized before being used by the OTP service.

---

## V-09: Verification Is Not Bound to a Challenge

Status: Mitigated

Severity: Medium

### Description

The /otp/request endpoint returns a challengeId, but verification does not use it.

Verification currently searches for any database entry matching:

phone + OTP

rather than verifying a specific challenge.

### Mitigation

OTP verification now requires the `challengeId` returned when the OTP
challenge is created.

Verification is therefore performed against a specific challenge rather
than searching for any matching OTP associated with the phone number.

### Expected Secure Behavior

The verification process should clearly identify and validate the intended OTP challenge.

---

## V-10: No Purpose Binding

Status: Identified

Severity: Medium

### Description

OTP challenges currently contain no information describing why they were created.

Examples of different purposes could include:

login
password-reset
phone-verification
transaction-approval

Without purpose binding, authentication logic may accidentally allow an OTP created for one workflow to be accepted in another.

### Expected Secure Behavior

Each OTP challenge should be explicitly associated with its intended purpose.


Current Vulnerability Summary

| ID   | Vulnerability            | Status     |
| ---- | ------------------------ | ---------- |
| V-01 | OTP Replay               | Mitigated  |
| V-02 | Unlimited OTP Guessing   | Mitigated  |
| V-03 | Weak OTP Generation      | Mitigated  |
| V-04 | Plaintext OTP Storage    | Identified |
| V-05 | No OTP Expiration        | Mitigated  |
| V-06 | Multiple Active OTPs     | Identified |
| V-07 | No Request Rate Limiting | Identified |
| V-08 | Weak Input Validation    | Identified |
| V-09 | No Challenge Binding     | Mitigated  |
| V-10 | No Purpose Binding       | Identified |
