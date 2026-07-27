# Sync local tools to Vapi via MCP

Use the Cursor **Vapi MCP** (`create_tool`, `list_tools`, `update_assistant`). Do not add a Vapi SDK to this repo.

## Prerequisites

1. Public webhook URL, e.g. from `npm run dev:tunnel`:
   `https://<ngrok-host>/webhooks/vapi`
2. Bearer auth header matching `VAPI_WEBHOOK_SECRET`

## Create a function tool (MCP `create_tool`)

Example for `get_business_hours`:

```json
{
  "type": "function",
  "name": "get_business_hours",
  "description": "Returns the business operating hours for a given timezone (mocked).",
  "function": {
    "parameters": {
      "type": "object",
      "properties": {
        "timezone": {
          "type": "string",
          "description": "IANA timezone, e.g. America/Los_Angeles"
        }
      }
    },
    "server": {
      "url": "https://YOUR_PUBLIC_HOST/webhooks/vapi",
      "headers": {
        "Authorization": "Bearer YOUR_VAPI_WEBHOOK_SECRET"
      }
    }
  }
}
```

Repeat for:

| name | required params |
|---|---|
| `lookup_knowledge` | `query` |
| `create_ticket` | `subject` |
| `schedule_appointment` | `startsAt` |
| `cancel_appointment` | `appointmentId` |
| `transfer_to_human` | (none required) |
| `save_lead` | at least one of name/email/phone |
| `echo` / `health` | optional builtins |

Local definitions live under `src/tools/business/*.tool.ts` and `src/tools/builtins/`. Keep **names identical**.

## Attach to an assistant

Use MCP `update_assistant` / `create_assistant` and set:

- `server.url` → same webhook URL
- tool ids returned by `create_tool`
- model/voice as needed

## Patient registration tools (synced)

Assistant: **Patient Registration Agent** (`5bfc0377-50bb-405e-8444-4cd35a48c71d`)

| Tool | Vapi tool id |
|---|---|
| `lookup_patient_by_phone` | `ed31406b-dc52-4ffe-bd1f-ab6717fe31ad` |
| `register_patient` | `65e8c357-e165-4474-b9b6-404a8e9dba1e` |
| `update_patient` | `17a31a72-d43a-48e2-b0a4-993e38a5f2a2` |
| `schedule_appointment` | `3981674e-59db-4f16-a659-69210acbbc7c` |

Server URL: `https://lanky-factsheet-cavity.ngrok-free.dev/webhooks/vapi`  
Bearer must match `VAPI_WEBHOOK_SECRET` in `.env`.

Legacy mocked tools still in the org (not attached to the registration assistant): `get_business_hours`, `lookup_knowledge`, `transfer_to_human`.

## Verify

1. `list_tools` — tools appear
2. Update each tool’s `server.url` to your public `/webhooks/vapi` URL
3. Place a test call that triggers a tool
4. Local logs show `Tool executed` with `mocked: true` in the result for placeholders
