# AGENTS.md — Calendly CLI Agent Guide

This file is for AI agents. It describes every available tool, its inputs, outputs, and the exact workflow patterns for scheduling automation.

---

## Setup

### 1. Install

```bash
npm install -g calendly-cli
```

### 2. Authenticate

```bash
# Interactive
calendly login

# Non-interactive (preferred for agents)
calendly login --token $CALENDLY_TOKEN
# OR
export CALENDLY_TOKEN=your_personal_access_token
```

After login, your `user_uri` and `organization_uri` are stored in `~/.calendly-cli/config.json`. Most commands auto-resolve these — you do NOT need to pass `--user` or `--organization` manually in the standard case.

### 3. Add MCP Server to Claude Code

```bash
claude mcp add calendly -- node $(npm root -g)/calendly-cli/dist/mcp.js
```

---

## Key Concepts

- **URI vs UUID**: Calendly uses full URIs (e.g. `https://api.calendly.com/users/ABC123`) as identifiers. When a command takes a `--user` or `--organization` flag, pass the full URI. When a command takes a positional `<uuid>` argument, pass just the UUID portion after the last `/`.
- **Auto-resolution**: After login, commands that need `user` or `organization` auto-resolve from `~/.calendly-cli/config.json`. Only override when acting on behalf of a different user.
- **All times are UTC ISO 8601**: e.g. `2025-03-21T14:00:00Z`
- **Paid plan required**: `invitees_create` (booking API) requires a paid Calendly plan.
- **Max 7-day window**: `availability_event_times` and `availability_busy_times` accept at most a 7-day range per call.

---

## Complete Tool Reference

### `users_me`
Get the authenticated user's profile.

**MCP input:** `{}`

**CLI:** `calendly users me`

**Returns:** `{ resource: { uri, name, email, slug, current_organization, timezone, created_at, updated_at } }`

**When to use:** At the start of a session to get your `user_uri` and `organization_uri` if not already stored.

---

### `users_get`
Get any user's profile by UUID.

**MCP input:** `{ uuid: string }`

**CLI:** `calendly users get <uuid>`

---

### `organizations_get`
Get organization details.

**MCP input:** `{ uuid: string }`

**CLI:** `calendly organizations get <uuid>`

---

### `organizations_memberships`
List all members of the organization.

**MCP input:** `{ organization?: string, user?: string, count?: number, page_token?: string, email?: string }`

**CLI:** `calendly organizations memberships [--organization <uri>] [--email <email>] [--count <n>]`

**Auto-resolves:** `organization` from config if omitted.

---

### `organizations_membership_get`
Get a specific membership record.

**MCP input:** `{ uuid: string }`

**CLI:** `calendly organizations membership <uuid>`

---

### `organizations_membership_remove`
Remove a user from the organization.

**MCP input:** `{ uuid: string }` — membership UUID, NOT user UUID.

**CLI:** `calendly organizations remove-member <uuid>`

---

### `organizations_invitations_list`
List pending/accepted invitations.

**MCP input:** `{ organization?: string, status?: string, email?: string, count?: number, page_token?: string, sort?: string }`

**Status values:** `pending` | `accepted` | `declined` | `revoked`

**CLI:** `calendly organizations invitations [--status pending]`

---

### `organizations_invitation_get`
Get a specific invitation.

**MCP input:** `{ org_uuid: string, uuid: string }`

**CLI:** `calendly organizations invitation --org-uuid <uuid> --uuid <uuid>`

---

### `organizations_invite`
Send an invitation email to add a user.

**MCP input:** `{ email: string, organization?: string }`

**CLI:** `calendly organizations invite --email newuser@example.com`

**Auto-resolves:** `organization` UUID from config.

---

### `organizations_revoke_invitation`
Revoke a pending invitation.

**MCP input:** `{ org_uuid: string, uuid: string }`

**CLI:** `calendly organizations revoke-invitation --org-uuid <uuid> --uuid <uuid>`

---

### `event_types_list`
List event types for a user or organization.

**MCP input:** `{ user?: string, organization?: string, active?: boolean, count?: number, page_token?: string, sort?: string, admin_managed?: boolean }`

**CLI:** `calendly event-types list [--active] [--count <n>] [--sort created_at:desc]`

**Auto-resolves:** `user` from config if neither `user` nor `organization` is provided.

**Returns:** `{ collection: [{ uri, slug, name, type, duration, color, active, scheduling_url, ... }], pagination: { count, next_page, ... } }`

**Key field:** `uri` — pass this as `event_type` in `availability_event_times` and `invitees_create`.

---

### `event_types_get`
Get a specific event type by UUID.

**MCP input:** `{ uuid: string }`

**CLI:** `calendly event-types get <uuid>`

---

### `one_off_event_type_create`
Create a temporary event type with a unique booking URL. Useful when you need to create a one-time scheduling link on the fly.

**MCP input:** `{ name: string, host?: string, duration: number, timezone: string, date_setting_type?: string, date_setting_start_date?: string, date_setting_end_date?: string, location_type?: string, location_additional?: string }`

**CLI:**
```bash
calendly event-types create-one-off \
  --name "Quick Chat" \
  --duration 30 \
  --timezone America/New_York
```

**Auto-resolves:** `host` from config user_uri.

**Returns:** `{ resource: { uri, booking_url, ... } }` — the `booking_url` is the shareable scheduling link.

---

### `scheduled_events_list`
List scheduled events. Most commonly used tool for checking the calendar.

**MCP input:** `{ user?: string, organization?: string, status?: string, min_start_time?: string, max_start_time?: string, count?: number, page_token?: string, sort?: string, invitee_email?: string }`

**Status:** `active` | `canceled`

**Sort:** `start_time:asc` | `start_time:desc`

**CLI:**
```bash
calendly scheduled-events list --status active
calendly scheduled-events list \
  --min-start-time 2025-03-01T00:00:00Z \
  --max-start-time 2025-03-31T23:59:59Z
```

**Auto-resolves:** `user` from config.

**Returns:** `{ collection: [{ uri, name, status, start_time, end_time, event_type, location, ... }], pagination: { ... } }`

---

### `scheduled_events_get`
Get full details of a specific event.

**MCP input:** `{ uuid: string }`

**CLI:** `calendly scheduled-events get <uuid>`

---

### `scheduled_events_cancel`
Cancel a scheduled event.

**MCP input:** `{ uuid: string, reason?: string }`

**CLI:** `calendly scheduled-events cancel <uuid> [--reason "reason"]`

---

### `invitees_list`
List all invitees for a scheduled event.

**MCP input:** `{ event_uuid: string, status?: string, count?: number, page_token?: string, sort?: string, email?: string }`

**CLI:** `calendly invitees list <event-uuid> [--status active]`

**Returns:** `{ collection: [{ uri, email, name, status, questions_and_answers, ... }] }`

---

### `invitees_get`
Get a specific invitee.

**MCP input:** `{ uuid: string }`

**CLI:** `calendly invitees get <uuid>`

---

### `invitees_create` ⭐ BOOK A MEETING
Programmatically book a meeting using the Calendly Scheduling API. **Requires a paid Calendly plan.**

**MCP input:**
```json
{
  "event_type": "https://api.calendly.com/event_types/UUID",
  "start_time": "2025-03-21T14:00:00Z",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "location_type": "zoom",
  "timezone": "America/Los_Angeles",
  "guests": "alice@co.com,bob@co.com",
  "custom_answers": "[{\"position\":0,\"value\":\"My answer\"}]",
  "text_reminder_number": "+14155551234"
}
```

**Required fields:** `event_type`, `start_time`, `name`, `email`

**Location types:** `zoom` | `google_conference` | `outbound_call` | `inbound_call` | `microsoft_teams_conference` | `gotomeeting` | `custom`

**CLI:**
```bash
calendly invitees create \
  --event-type https://api.calendly.com/event_types/UUID \
  --start-time 2025-03-21T14:00:00Z \
  --name "Jane Smith" \
  --email jane@example.com
```

**Returns:** `{ resource: { uri, status, start_time, end_time, event_type, invitees_counter, ... } }`

**Important:** `start_time` must be an available slot from `availability_event_times`. Booking an unavailable slot returns a 409 error.

---

### `no_show_create`
Mark an invitee as a no-show.

**MCP input:** `{ uuid: string }` — invitee UUID

**CLI:** `calendly invitees no-show <uuid>`

---

### `no_show_delete`
Remove a no-show mark.

**MCP input:** `{ uuid: string }` — no-show object UUID (from the `no_show` field on an invitee, NOT the invitee UUID)

**CLI:** `calendly invitees undo-no-show <uuid>`

---

### `availability_event_times` ⭐ FIND OPEN SLOTS
Get available booking slots for an event type. Use this before `invitees_create`.

**MCP input:**
```json
{
  "event_type": "https://api.calendly.com/event_types/UUID",
  "start_time": "2025-03-20T00:00:00Z",
  "end_time": "2025-03-27T00:00:00Z",
  "timezone": "America/Los_Angeles"
}
```

**Constraints:**
- `end_time` must be within 7 days of `start_time`
- Times must be in the future

**Returns:** `{ collection: [{ status: "available", invitees_remaining: 1, start_time: "2025-03-21T14:00:00Z" }] }`

**Workflow:** Call this first, pick a `start_time` from the results, then pass it to `invitees_create`.

---

### `availability_busy_times`
Get blocked/busy time periods for a user.

**MCP input:** `{ user?: string, start_time: string, end_time: string }`

**CLI:** `calendly availability busy-times --start-time ... --end-time ...`

**Auto-resolves:** `user` from config.

**Returns:** `{ collection: [{ type, start_time, end_time, ... }] }`

---

### `availability_schedules`
List the user's working hours schedules.

**MCP input:** `{ user?: string }`

**CLI:** `calendly availability schedules`

**Auto-resolves:** `user` from config.

---

### `availability_schedule_get`
Get a specific availability schedule.

**MCP input:** `{ uuid: string }`

**CLI:** `calendly availability schedule <uuid>`

---

### `webhooks_list`
List webhook subscriptions.

**MCP input:** `{ scope: string, organization?: string, user?: string, count?: number, page_token?: string }`

**Scope:** `organization` | `user`

**CLI:** `calendly webhooks list --scope organization`

**Auto-resolves:** `organization` and `user` from config.

---

### `webhooks_get`
Get a specific webhook.

**MCP input:** `{ uuid: string }`

**CLI:** `calendly webhooks get <uuid>`

---

### `webhooks_create`
Create a webhook subscription.

**MCP input:**
```json
{
  "url": "https://example.com/webhook",
  "events": "invitee.created,invitee.canceled",
  "scope": "organization",
  "signing_key": "optional_secret"
}
```

**Available events:** `invitee.created` | `invitee.canceled` | `invitee_no_show.created` | `invitee_no_show.deleted` | `routing_form_submission.created`

**Note:** `routing_form_submission.created` is only valid with `scope: organization`.

**CLI:**
```bash
calendly webhooks create \
  --url https://example.com/webhook \
  --events invitee.created,invitee.canceled \
  --scope organization \
  --signing-key mysecret
```

**Auto-resolves:** `organization` from config.

---

### `webhooks_delete`
Delete a webhook subscription.

**MCP input:** `{ uuid: string }`

**CLI:** `calendly webhooks delete <uuid>`

---

### `routing_forms_list`
List routing forms for the organization.

**MCP input:** `{ organization?: string, count?: number, page_token?: string, sort?: string }`

**CLI:** `calendly routing-forms list`

**Auto-resolves:** `organization` from config.

---

### `routing_forms_get`
Get a specific routing form.

**MCP input:** `{ uuid: string }`

**CLI:** `calendly routing-forms get <uuid>`

---

### `routing_form_submissions_list`
List submissions for a routing form.

**MCP input:** `{ routing_form: string, count?: number, page_token?: string, sort?: string }`

**`routing_form`** accepts the full URI or UUID.

**CLI:** `calendly routing-forms submissions <routing-form-uri>`

---

### `routing_form_submission_get`
Get a specific routing form submission.

**MCP input:** `{ uuid: string }`

**CLI:** `calendly routing-forms submission <uuid>`

---

### `scheduling_links_create`
Create a shareable scheduling link. Use this when you want to give someone a URL to self-book.

**MCP input:**
```json
{
  "owner": "https://api.calendly.com/event_types/UUID",
  "owner_type": "EventType",
  "max_event_count": 1
}
```

**`owner_type`:** `EventType` | `User`

**`max_event_count`:** Omit for unlimited. Set to `1` for single-use.

**CLI:**
```bash
calendly scheduling-links create \
  --owner https://api.calendly.com/event_types/UUID \
  --owner-type EventType \
  --max-event-count 1
```

**Returns:** `{ resource: { booking_url, owner, ... } }` — share `booking_url` with the person to book.

---

### `groups_list`
List groups in the organization.

**MCP input:** `{ organization?: string, count?: number, page_token?: string }`

**CLI:** `calendly groups list`

**Auto-resolves:** `organization` from config.

---

### `groups_get`
Get a specific group.

**MCP input:** `{ uuid: string }`

**CLI:** `calendly groups get <uuid>`

---

### `group_relationships_list`
List members of a group.

**MCP input:** `{ group: string, count?: number, page_token?: string }`

**`group`** is the full group URI.

**CLI:** `calendly groups relationships --group <uri>`

---

### `data_compliance_delete_invitees`
Permanently delete all scheduling data for one or more email addresses. **GDPR / irreversible.**

**MCP input:** `{ emails: string }` — comma-separated emails

**CLI:** `calendly data-compliance delete-invitees --emails "jane@example.com,bob@example.com"`

---

### `data_compliance_delete_scheduled_event_data`
Delete data for a specific scheduled event invitee. **GDPR / irreversible.**

**MCP input:** `{ uuid: string }` — invitee UUID

**CLI:** `calendly data-compliance delete-event-data <uuid>`

---

### `activity_log_list`
List org activity log entries. **Enterprise plan required.**

**MCP input:** `{ organization?: string, from?: string, to?: string, action?: string, count?: number, page_token?: string, sort?: string }`

**CLI:**
```bash
calendly activity-log list \
  --from 2025-01-01T00:00:00Z \
  --to 2025-01-31T23:59:59Z \
  --sort occurred_at:desc
```

**Auto-resolves:** `organization` from config.

---

## Agent Workflow Patterns

### Pattern 1: Full Scheduling Loop (Book a Meeting)

```
1. event_types_list          → get available event types, note event_type URI
2. availability_event_times  → find open slots in desired date range (max 7 days)
3. invitees_create           → book the meeting with chosen start_time
4. scheduled_events_list     → confirm the booking appears
```

**Example flow for an AI agent:**
```
Tool: event_types_list
→ Pick event_type.uri for "30 Minute Meeting"

Tool: availability_event_times
  event_type: "https://api.calendly.com/event_types/ABC"
  start_time: "2025-03-20T00:00:00Z"
  end_time: "2025-03-27T00:00:00Z"
→ Pick first available start_time from collection

Tool: invitees_create
  event_type: "https://api.calendly.com/event_types/ABC"
  start_time: "2025-03-21T14:00:00Z"
  name: "Jane Smith"
  email: "jane@example.com"
→ Meeting booked, get event URI from response
```

### Pattern 2: Generate a Shareable Booking Link

```
1. event_types_list          → get event_type URI
2. scheduling_links_create   → create link with max_event_count
3. Return booking_url to user
```

### Pattern 3: Create a One-Off Event Type + Share Link

```
1. one_off_event_type_create → creates temporary event type
2. Return booking_url from response directly
```

### Pattern 4: Check Today's Schedule

```
1. scheduled_events_list
   status: "active"
   min_start_time: "[today]T00:00:00Z"
   max_start_time: "[today]T23:59:59Z"
   sort: "start_time:asc"
```

### Pattern 5: Find Availability for Multiple Days

The API supports max 7 days per call. For longer ranges, call `availability_event_times` multiple times:

```
Call 1: start_time=2025-03-20, end_time=2025-03-27
Call 2: start_time=2025-03-27, end_time=2025-04-03
Call 3: start_time=2025-04-03, end_time=2025-04-10
```

### Pattern 6: Set Up Real-Time Booking Notifications

```
1. webhooks_create
   url: "https://your-server.com/webhook"
   events: "invitee.created,invitee.canceled"
   scope: "organization"
   signing_key: "your_secret"
→ Receive POST requests on every booking/cancellation
```

### Pattern 7: Cancel a Meeting

```
1. scheduled_events_list (find by invitee_email or date range)
2. scheduled_events_cancel (use uuid from event URI)
```

---

## Pagination

All list commands support cursor-based pagination via `page_token` and `count`:

```
# Page 1
event_types_list count=50
→ response.pagination.next_page_token = "abc123"

# Page 2
event_types_list count=50 page_token="abc123"
```

---

## Error Handling

| Exit code | Meaning |
|-----------|---------|
| 0 | Success |
| 1 | Error (auth failure, API error, validation error) |

Error output goes to **stderr**, results go to **stdout**. Safe to pipe stdout to jq while errors still appear in the terminal.

**Common errors:**
- `[AUTH_ERROR]` — Invalid or expired token. Run `calendly login` again.
- `[NOT_FOUND]` — UUID doesn't exist or you don't have access to it.
- `[VALIDATION_ERROR]` — Missing required field or invalid value.
- `[RATE_LIMIT]` — Too many requests. The client auto-retries with backoff.
- `[SERVER_ERROR]` — Calendly API is down. Auto-retried up to 3 times.

---

## Config Location

`~/.calendly-cli/config.json` — permissions `0600` (owner read/write only).

```json
{
  "token": "eyJ...",
  "user_uri": "https://api.calendly.com/users/AAABBBCCC",
  "user_name": "Brandon Charleson",
  "user_email": "brandon@example.com",
  "organization_uri": "https://api.calendly.com/organizations/XXXYYY"
}
```

To check current auth state: `calendly auth-status`

---

## Rate Limits

Calendly API rate limits vary by plan. The client handles `429 Too Many Requests` automatically with exponential backoff (up to 3 retries, respecting the `Retry-After` header). No manual retry logic needed.
