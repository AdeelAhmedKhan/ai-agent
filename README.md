# Voice AI Agent — Patient Registration

Take-home voice agent that registers U.S. patient demographics over a natural conversation (Vapi), persists them in Supabase Postgres, and exposes a small REST API for reviewers.

> Synthetic / demo data only. Not a HIPAA product. Do not store real patient PHI.

## Submission


| Item                     | Value                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| **Repository URL**       | [https://github.com/AdeelAhmedKhan/ai-agent](https://github.com/AdeelAhmedKhan/ai-agent)   |
| **Phone number to call** | +1 (346) 598-6559                                                                          |
| **API base URL**         | [https://api-production-97dea.up.railway.app](https://api-production-97dea.up.railway.app) |
| **Credentials / notes**  | See [Testing credentials](#testing-credentials)                                            |


### Live demo


| Item                    | Value                                                                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phone number**        | +1 (346) 598-6559                                                                                                                                  |
| **Browser voice demo**  | [Talk in browser (Vapi)](https://vapi.ai?demo=true&shareKey=bb256660-79b4-45ef-a26f-42d79b7d6ed3&assistantId=5bfc0377-50bb-405e-8444-4cd35a48c71d) |
| **API base URL**        | [https://api-production-97dea.up.railway.app](https://api-production-97dea.up.railway.app)                                                         |
| **Health**              | [https://api-production-97dea.up.railway.app/health](https://api-production-97dea.up.railway.app/health)                                           |
| **Patient registry UI** | [https://api-production-97dea.up.railway.app/registry](https://api-production-97dea.up.railway.app/registry)                                       |
| **Patients REST API**   | [https://api-production-97dea.up.railway.app/patients](https://api-production-97dea.up.railway.app/patients)                                       |
| **Vapi webhook**        | [https://api-production-97dea.up.railway.app/webhooks/vapi](https://api-production-97dea.up.railway.app/webhooks/vapi)                             |


### Testing credentials


| Credential                        | Value / how to use                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------- |
| **`x-api-key` (`ADMIN_API_KEY`)** | `dev-d2667890-1670-4234-a342-143478901234`                                            |
| **Registry UI**                   | Open `/registry` → paste the API key above when prompted                              |
| **Vapi webhook auth**             | Already configured on the live assistant/tools — not needed for phone or REST testing |


Example API check:

```bash
curl -s https://api-production-97dea.up.railway.app/patients \
  -H "x-api-key: dev-d2667890-1670-4234-a342-143478901234"
```

### How to review

1. **Call** +1 (346) 598-6559 — register a (synthetic) patient by voice, confirm read-back, hang up
2. Or use the **[browser voice demo](https://vapi.ai?demo=true&shareKey=bb256660-79b4-45ef-a26f-42d79b7d6ed3&assistantId=5bfc0377-50bb-405e-8444-4cd35a48c71d)**
3. **Verify** the record in the [registry UI](https://api-production-97dea.up.railway.app/registry) or `GET /patients` with the API key above
4. Call again with the same phone number to exercise returning-caller / update flow

Local setup (optional): [Quick start](#quick-start).

## Tech stack (why)


| Layer             | Choice                                    | Justification                                                                        |
| ----------------- | ----------------------------------------- | ------------------------------------------------------------------------------------ |
| Telephony + voice | **Vapi**                                  | Fastest path to STT/TTS + tool calling within a short build window                   |
| Backend           | **Node.js + Express + TypeScript**        | Clear layers, fast iteration, strong typing                                          |
| LLM (server-side) | **Groq / Dashscope** (OpenAI-compatible)  | Used for optional server features; live call LLM is configured on the Vapi assistant |
| Database          | **Supabase Postgres**                     | Persistent relational store with migrations, constraints, hosted free tier           |
| Tunnel / host     | **ngrok** locally, **Railway** for deploy | Matches challenge hosting guidance                                                   |


## Architecture

```
Caller ↔ Vapi (LLM + voice) ↔ POST /webhooks/vapi ↔ ToolService ↔ PatientService ↔ Supabase
                                                              ↕
                                                     REST /patients (same service)
```

Layers: `Routes → Controllers → Services → Repositories / Tools / Prompts`.

Voice tools call `PatientService` directly (same path as REST) — not HTTP self-calls.

## Quick start

```bash
cp .env.example .env   # fill secrets
npm install
npm run db:push        # apply migrations including patients
npm run dev            # http://localhost:3000
# optional public tunnel:
npm run dev:tunnel     # prints Vapi Server URL
```

### Required env vars

See [`.env.example`](.env.example). Critical:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_MODEL`
- `VAPI_WEBHOOK_SECRET`, `VAPI_API_KEY`
- `ADMIN_API_KEY` — used as `x-api-key` for `/patients` and `/api/*`
- Optional: `NGROK_AUTHTOKEN`, `NGROK_DOMAIN`, `PUBLIC_BASE_URL`

## Patient registry UI

Browse registered patients in the browser (separate route from the REST API):

```text
http://localhost:3000/registry
```

1. Open the URL (with `npm run dev` running)
2. Enter `ADMIN_API_KEY` from `.env`
3. Filter by last name / phone / DOB, open a record for full demographics, optionally soft-delete

`/dashboard` redirects to `/registry`. The UI calls the same `/patients` REST API (key kept in `sessionStorage` only).

## Patients REST API

Auth: header `x-api-key: <ADMIN_API_KEY>`.

Envelope: `{ "data": ..., "error": null }` or `{ "data": null, "error": { "code", "message", "details?" } }`.


| Method   | Path            | Notes                                               |
| -------- | --------------- | --------------------------------------------------- |
| `GET`    | `/patients`     | Filters: `?last_name=&date_of_birth=&phone_number=` |
| `GET`    | `/patients/:id` | UUID `patient_id`                                   |
| `POST`   | `/patients`     | Create (201)                                        |
| `PUT`    | `/patients/:id` | Partial update                                      |
| `DELETE` | `/patients/:id` | Soft-delete (`deleted_at`)                          |


Examples:

```bash
curl -s http://localhost:3000/patients -H "x-api-key: $ADMIN_API_KEY"

curl -s -X POST http://localhost:3000/patients \
  -H "x-api-key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name":"Ada","last_name":"Lovelace","date_of_birth":"12/10/1990",
    "sex":"Female","phone_number":"4155550181","address_line_1":"1 Analytical Eng",
    "city":"San Francisco","state":"CA","zip_code":"94105"
  }'
```

Seed patients (synthetic): Jane Doe `4155550101`, John Smith `2125550142`.

## Voice agent behavior

System prompt (commented design notes): [`prompts/system/patient-registration.md`](prompts/system/patient-registration.md)

Flow:

1. Collect required demographics conversationally (one question at a time; corrections allowed).
2. Offer optional insurance / emergency contact / preferred language.
3. **Read back all fields** and get explicit confirmation.
4. Persist via tools (`confirmed: true` required):
  - `lookup_patient_by_phone` — duplicate detection
  - `register_patient` / `update_patient`
5. Close with “You're all set, [First Name].” Optional mocked `schedule_appointment`.

Invalid fields are re-prompted specifically. Failed DB writes return a tool error so the agent can apologize (no silent failure). Mid-call drops do **not** create partial patient rows.

Default agent tools (migration `00004_patients.sql`): patient tools + `schedule_appointment`.

## Local Vapi testing (optional)

Production uses Railway + the live phone / [browser demo](https://vapi.ai?demo=true&shareKey=bb256660-79b4-45ef-a26f-42d79b7d6ed3&assistantId=5bfc0377-50bb-405e-8444-4cd35a48c71d). For local debugging:

1. `npm run db:push && npm run dev:tunnel`
2. Temporarily point Vapi Server URL at `https://<ngrok>/webhooks/vapi` with Bearer = `VAPI_WEBHOOK_SECRET`
3. Keep tool names identical to local registry (`lookup_patient_by_phone`, `register_patient`, `update_patient`, `schedule_appointment`)

Guide: [`docs/vapi-mcp-tools.md`](docs/vapi-mcp-tools.md).

## Other HTTP endpoints


| Method           | Path                  | Auth                     |
| ---------------- | --------------------- | ------------------------ |
| `GET`            | `/health`             | —                        |
| `GET`            | `/ready`              | —                        |
| `POST`           | `/webhooks/vapi`      | Bearer / `x-vapi-secret` |
| `GET/POST/PATCH` | `/api/agents`         | `x-api-key`              |
| `POST`           | `/api/intents/detect` | `x-api-key`              |


## Database

Migrations under [`supabase/migrations/`](supabase/migrations/):

- `00001` — agents, calls, events, tools
- `00002` — legacy business-tool seed (superseded for default agent by `00004`)
- `00003` — messages / call_summary
- `00004` — **patients** table, constraints, seed, registration agent tools/prompt

## Observability

- Pino request logs + webhook type/call id
- Successful create/update logs the **full patient payload** (`PatientService`)
- Tool invocations stored in `tool_invocations`; raw Vapi events in `call_events`

## Tests

```bash
npm test
npm run typecheck
```

Coverage includes patient validators (name/DOB/phone/state/zip), confirm-gate on register/update tools, and PatientService soft-delete.

## Known limitations / trade-offs

- Live dial-in: **+1 (346) 598-6559**; browser demo also available via the Vapi share link above.
- Live call LLM/voice run on **Vapi**; backend LLM keys power optional server-side features.
- Appointment scheduling tool is **mocked**.
- Soft-delete hides rows from list/get; phone uniqueness applies to active rows only.
- ConversationService / intent detection are not required on the voice registration path.
- Not HIPAA compliant (by design for this assessment).

## Railway

Live service: **[https://api-production-97dea.up.railway.app](https://api-production-97dea.up.railway.app)**

```bash
npx @railway/cli login
npx @railway/cli link          # project voice-ai-agent / service api
npx @railway/cli up -y --service api
npx @railway/cli domain --service api
```

Redeploy after code changes with `npx @railway/cli up -y --service api`.

Point Vapi assistant **Server URL** and tool servers at:

`https://api-production-97dea.up.railway.app/webhooks/vapi`

(Bearer = `VAPI_WEBHOOK_SECRET`)

## Next steps

1. Optional: Spanish switch, transcript linked to `patient_id`, ConversationService on the webhook path
2. Rotate `ADMIN_API_KEY` after the review window if the repo stays public

## Project layout

- `src/routes/patients.routes.ts` — REST
- `src/services/patient.service.ts` — shared persistence
- `src/tools/patients/` — voice tools
- `prompts/system/patient-registration.md` — intake prompt
- `supabase/migrations/00004_patients.sql` — schema + seed

