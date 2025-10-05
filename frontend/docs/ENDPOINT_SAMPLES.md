# Endpoint Samples

## JWT Example
```bash
curl -X POST https://auth.click2mail.com/oauth2/token \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

Response:
```json
{ "access_token": "xyz123", "token_type": "Bearer", "expires_in": 3600 }
```

## Example Request with Token
```bash
curl -X POST https://api.click2mail.com/v2/jobs/submit/single/doc \
  -H "Authorization: Bearer xyz123" \
  -H "Content-Type: application/json" \
  -d '{ "document": "...", "recipient": "..." }'
```
