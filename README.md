# calendly-cli

Agent-native CLI and MCP server for the [Calendly API v2](https://developer.calendly.com/api-docs). 40 commands covering the full API — authentication, scheduling, availability, webhooks, routing forms, groups, and data compliance.

## Install

```bash
npm install -g calendly-cli
```

Or run without installing:

```bash
npx calendly-cli --help
```

---

## Authentication

Get a Personal Access Token from [Calendly Developer Settings](https://calendly.com/integrations/api_webhooks).

```bash
calendly login
# Prompted for your token interactively

# Or non-interactively:
calendly login --token YOUR_TOKEN
```

Token is stored at `~/.calendly-cli/config.json` (mode `0600`). After login, your user URI and organization URI are auto-resolved — most commands work with no additional flags.

**Priority order for token resolution:**
1. `--token` CLI flag
2. `CALENDLY_TOKEN` environment variable
3. `~/.calendly-cli/config.json`

---

## MCP Server (for AI Agents)

Start the MCP server for use with Claude, Cursor, or any MCP-compatible AI:

```bash
calendly mcp
```

### Add to Claude Code

```bash
claude mcp add calendly -- node $(which calendly-cli | xargs dirname)/../lib/node_modules/calendly-cli/dist/mcp.js
```

Or if installed locally:

```bash
claude mcp add calendly -- node /path/to/calendly-cli/dist/mcp.js
```

### Add to Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "calendly": {
      "command": "node",
      "args": ["/path/to/calendly-cli/dist/mcp.js"],
      "env": {
        "CALENDLY_TOKEN": "your_token_here"
      }
    }
  }
}
```

The MCP server exposes all 40 tools with full Zod schemas. Every CLI command is available as an MCP tool — same names, same parameters.

---

## Commands

### Auth

```bash
calendly login [--token <token>]         # Authenticate and store credentials
calendly logout                           # Clear stored credentials
calendly auth-status                      # Show current auth state and stored URIs
```

### Users

```bash
calendly users me                         # Get your profile (name, email, URI, org)
calendly users get <uuid>                 # Get any user by UUID
```

### Event Types

```bash
calendly event-types list                 # Your event types (auto-resolves user URI)
calendly event-types list --organization <uri>
calendly event-types list --active        # Active only
calendly event-types list --count 50 --sort created_at:desc
calendly event-types get <uuid>           # Get a specific event type

# Create a temporary one-off event type with a unique booking URL
calendly event-types create-one-off \
  --name "Quick Chat" \
  --duration 30 \
  --timezone America/New_York
```

### Scheduled Events

```bash
calendly scheduled-events list            # Your upcoming events (auto-resolves user URI)
calendly scheduled-events list --status active
calendly scheduled-events list --status canceled
calendly scheduled-events list \
  --min-start-time 2025-03-01T00:00:00Z \
  --max-start-time 2025-03-31T23:59:59Z
calendly scheduled-events list --invitee-email jane@example.com
calendly scheduled-events list --sort start_time:desc --count 50
calendly scheduled-events get <uuid>      # Get a specific event
calendly scheduled-events cancel <uuid>   # Cancel an event
calendly scheduled-events cancel <uuid> --reason "Scheduling conflict"
```

### Invitees (Book a Meeting)

```bash
# List invitees for an event
calendly invitees list <event-uuid>
calendly invitees list <event-uuid> --status active
calendly invitees list <event-uuid> --email jane@example.com

# Get a specific invitee
calendly invitees get <uuid>

# Book a meeting programmatically (Scheduling API — requires paid Calendly plan)
calendly invitees create \
  --event-type https://api.calendly.com/event_types/EVENT_UUID \
  --start-time 2025-03-21T14:00:00Z \
  --name "Jane Smith" \
  --email jane@example.com

# Book with specific location
calendly invitees create \
  --event-type https://api.calendly.com/event_types/EVENT_UUID \
  --start-time 2025-03-21T14:00:00Z \
  --name "Jane Smith" \
  --email jane@example.com \
  --location-type zoom

# Add guests
calendly invitees create \
  --event-type https://api.calendly.com/event_types/EVENT_UUID \
  --start-time 2025-03-21T14:00:00Z \
  --name "Jane Smith" \
  --email jane@example.com \
  --guests "alice@co.com,bob@co.com"

# No-show management
calendly invitees no-show <invitee-uuid>      # Mark as no-show
calendly invitees undo-no-show <no-show-uuid> # Remove no-show mark
```

### Availability

```bash
# Find available time slots for an event type (max 7-day range)
calendly availability event-times \
  --event-type https://api.calendly.com/event_types/EVENT_UUID \
  --start-time 2025-03-20T00:00:00Z \
  --end-time 2025-03-27T00:00:00Z

# Get busy/blocked times for a user (max 7-day range)
calendly availability busy-times \
  --start-time 2025-03-20T00:00:00Z \
  --end-time 2025-03-27T00:00:00Z

# List working hours schedules
calendly availability schedules
calendly availability schedule <uuid>     # Get a specific schedule
```

### Organizations

```bash
calendly organizations get <uuid>               # Get org details
calendly organizations memberships               # List all members
calendly organizations memberships --email user@example.com
calendly organizations membership <uuid>         # Get specific membership
calendly organizations remove-member <uuid>      # Remove a member

# Invitations
calendly organizations invitations               # List pending invitations
calendly organizations invitations --status pending
calendly organizations invite --email newuser@example.com
calendly organizations invitation --org-uuid ORG_UUID --uuid INV_UUID
calendly organizations revoke-invitation --org-uuid ORG_UUID --uuid INV_UUID
```

### Webhooks

```bash
# List webhooks
calendly webhooks list --scope organization
calendly webhooks list --scope user
calendly webhooks get <uuid>

# Create a webhook
calendly webhooks create \
  --url https://example.com/webhook \
  --events invitee.created,invitee.canceled \
  --scope organization

# With signing key for payload verification
calendly webhooks create \
  --url https://example.com/webhook \
  --events invitee.created \
  --scope organization \
  --signing-key mysecretkey

# Delete a webhook
calendly webhooks delete <uuid>
```

**Available webhook events:**
- `invitee.created` — new booking
- `invitee.canceled` — cancellation
- `invitee_no_show.created` — no-show marked
- `invitee_no_show.deleted` — no-show removed
- `routing_form_submission.created` — routing form submitted (org scope only)

### Routing Forms

```bash
calendly routing-forms list                              # List org routing forms
calendly routing-forms get <uuid>                        # Get specific form
calendly routing-forms submissions <routing-form-uri>    # List submissions
calendly routing-forms submission <uuid>                 # Get specific submission
```

### Scheduling Links

```bash
# Create a shareable scheduling link (single-use or capped)
calendly scheduling-links create \
  --owner https://api.calendly.com/event_types/EVENT_UUID \
  --owner-type EventType

# Limit to 5 bookings
calendly scheduling-links create \
  --owner https://api.calendly.com/event_types/EVENT_UUID \
  --owner-type EventType \
  --max-event-count 5
```

### Groups

```bash
calendly groups list                              # List org groups
calendly groups get <uuid>                        # Get a group
calendly groups relationships --group <uri>       # List group members
```

### Data Compliance (GDPR)

```bash
# Delete all data for one or more invitees by email
calendly data-compliance delete-invitees --emails jane@example.com
calendly data-compliance delete-invitees --emails "jane@example.com,bob@example.com"

# Delete data for a specific scheduled event invitee
calendly data-compliance delete-event-data <invitee-uuid>
```

### Activity Log (Enterprise)

```bash
calendly activity-log list
calendly activity-log list --from 2025-01-01T00:00:00Z --to 2025-01-31T23:59:59Z
calendly activity-log list --action event_type.created
calendly activity-log list --sort occurred_at:desc --count 50
```

---

## Global Options

Available on every command:

| Flag | Description |
|------|-------------|
| `--token <token>` | Override stored token |
| `--pretty` | Pretty-print JSON output |
| `--quiet` | No output, exit code only |
| `--fields <fields>` | Comma-separated field names to include |

```bash
calendly scheduled-events list --pretty
calendly users me --fields name,email,uri
calendly event-types list --quiet  # Exit 0 = success, 1 = error
```

---

## Output Format

All commands output JSON to stdout. Errors are written to stderr.

```bash
# Machine-readable (default)
calendly users me
# → {"resource":{"uri":"https://...","name":"Brandon","email":"..."}}

# Pretty-printed
calendly users me --pretty

# Field filtering
calendly scheduled-events list --fields uri,start_time,end_time,status

# Pipe to jq
calendly event-types list | jq '.collection[].name'
```

---

## Full Agent Scheduling Loop

```bash
# 1. Find your event types
calendly event-types list --pretty

# 2. Check available slots (next 7 days)
calendly availability event-times \
  --event-type https://api.calendly.com/event_types/YOUR_EVENT_UUID \
  --start-time 2025-03-20T00:00:00Z \
  --end-time 2025-03-27T00:00:00Z

# 3. Book a slot
calendly invitees create \
  --event-type https://api.calendly.com/event_types/YOUR_EVENT_UUID \
  --start-time 2025-03-21T14:00:00Z \
  --name "Jane Smith" \
  --email jane@example.com

# 4. Confirm it's on the calendar
calendly scheduled-events list --status active --pretty
```

---

## Config File

Stored at `~/.calendly-cli/config.json` (permissions: `0600`):

```json
{
  "token": "your_personal_access_token",
  "user_uri": "https://api.calendly.com/users/YOUR_UUID",
  "user_name": "Brandon Charleson",
  "user_email": "brandon@example.com",
  "organization_uri": "https://api.calendly.com/organizations/ORG_UUID"
}
```

After `calendly login`, all commands auto-resolve your user and organization — no need to pass `--user` or `--organization` flags manually.

---

## MCP Tool Reference

All 40 tools registered in the MCP server:

| Tool | Description |
|------|-------------|
| `users_me` | Get authenticated user |
| `users_get` | Get user by UUID |
| `organizations_get` | Get organization |
| `organizations_memberships` | List org members |
| `organizations_membership_get` | Get membership |
| `organizations_membership_remove` | Remove member |
| `organizations_invitations_list` | List invitations |
| `organizations_invitation_get` | Get invitation |
| `organizations_invite` | Send invitation |
| `organizations_revoke_invitation` | Revoke invitation |
| `event_types_list` | List event types |
| `event_types_get` | Get event type |
| `one_off_event_type_create` | Create one-off event type |
| `scheduled_events_list` | List scheduled events |
| `scheduled_events_get` | Get scheduled event |
| `scheduled_events_cancel` | Cancel event |
| `invitees_list` | List invitees |
| `invitees_get` | Get invitee |
| `invitees_create` | Book a meeting |
| `no_show_create` | Mark no-show |
| `no_show_delete` | Remove no-show |
| `availability_event_times` | Available slots |
| `availability_busy_times` | Busy/blocked times |
| `availability_schedules` | Working hours |
| `availability_schedule_get` | Get schedule |
| `webhooks_list` | List webhooks |
| `webhooks_get` | Get webhook |
| `webhooks_create` | Create webhook |
| `webhooks_delete` | Delete webhook |
| `routing_forms_list` | List routing forms |
| `routing_forms_get` | Get routing form |
| `routing_form_submissions_list` | List submissions |
| `routing_form_submission_get` | Get submission |
| `scheduling_links_create` | Create scheduling link |
| `groups_list` | List groups |
| `groups_get` | Get group |
| `group_relationships_list` | List group members |
| `data_compliance_delete_invitees` | GDPR delete by email |
| `data_compliance_delete_scheduled_event_data` | GDPR delete by UUID |
| `activity_log_list` | Activity log (Enterprise) |

---

## Development

```bash
git clone https://github.com/bcharleson/calendly-cli
cd calendly-cli
npm install
npm run dev -- users me          # Run CLI without building
npm run dev:mcp                   # Run MCP server without building
npm run build                     # Compile to dist/
npm run typecheck                 # TypeScript check
npm test                          # Run tests
```

---

## License

MIT
