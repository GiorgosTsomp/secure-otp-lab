# Attack Demonstrations

This directory contains proof-of-concept security tests against the local
OTP application included in this repository.

All demonstrations are intended exclusively for this local security lab.

## Replay Attack

`replay_attack.py` demonstrates that the naive OTP implementation does
not enforce single-use verification.

A valid OTP is submitted once and then replayed using the exact same
request. The server accepts both requests because the OTP is never
invalidated after successful verification.

## Brute-Force Attack

`brute_force.py` demonstrates that the naive verification endpoint has
no attempt limit or rate limiting.

For a practical local demonstration, `OTP_LENGTH` can temporarily be
changed from 6 to 4 in the local `.env` file. This reduces the search
space while preserving the underlying vulnerability.

The normal project configuration remains a 6-digit OTP.

## Scope

These scripts target only the application running locally on
`localhost:3000`.