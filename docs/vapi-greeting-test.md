# Vapi greeting connectivity test

## What was set up

- **Assistant:** `Local Greeting Test`  
  - ID: `5bfc0377-50bb-405e-8444-4cd35a48c71d`
  - Speaks first: *"Hello! Thanks for calling. This is a quick test of our voice agent. How can I help you today?"*
  - Model: `gpt-4o-mini` · Voice: Vapi `Elliot`
  - No tools attached (greeting-only)

- **Webhook (ngrok for now):**  
  `https://lanky-factsheet-cavity.ngrok-free.dev/webhooks/vapi`  
  Auth: `Authorization: Bearer <VAPI_WEBHOOK_SECRET from .env>`  
  Tools `get_business_hours`, `lookup_knowledge`, `transfer_to_human` already point here.  
  In Vapi Dashboard → Assistant / Org **Server URL**, set the same webhook URL.

## Run locally

**1. Start API (port 3000)**

```bash
npm run dev
```

Confirm: `curl http://127.0.0.1:3000/health` → `{"status":"ok",...}`

**2. Point ngrok at 3000 (not 80)**

Your current tunnel targets port **80**. The app listens on **3000**. Restart ngrok:

```bash
ngrok http --url=lanky-factsheet-cavity.ngrok-free.dev 3000
```

**3. Optional — org / assistant Server URL in Vapi Dashboard**

For call status / tool webhooks to hit this backend:

- Server URL: `https://lanky-factsheet-cavity.ngrok-free.dev/webhooks/vapi`
- Credential: Bearer = value of `VAPI_WEBHOOK_SECRET` in `.env`

**4. Talk test (no phone number required)**

1. Open [Vapi Dashboard → Assistants](https://dashboard.vapi.ai)
2. Open **Local Greeting Test**
3. Use **Talk** / web call
4. You should hear the greeting first

Outbound phone calls need a Vapi phone number (`list_phone_numbers` is currently empty).

## Verify webhook (optional)

After ngrok → 3000:

```bash
curl -i -X POST "https://lanky-factsheet-cavity.ngrok-free.dev/webhooks/vapi" \
  -H "Authorization: Bearer YOUR_VAPI_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d "{\"message\":{\"type\":\"status-update\",\"status\":\"in-progress\",\"call\":{\"id\":\"test-call-1\"}}}"
```

Expect HTTP 200. Local logs should show `Vapi webhook received`.
