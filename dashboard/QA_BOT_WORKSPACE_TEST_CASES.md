# Bot Workspace Screen Test Cases

Screen under test: Bot configuration modal with tabs `Live Chat`, `Story Builder`, `Canned Responses`, `Small Talk`, `Data Collection`.

## Function Flow Map

| UI Function | Frontend Code Path | API Endpoint(s) |
|---|---|---|
| Load inbox list | `dashboard/components/LiveChat.tsx` (`fetchConvs`) | `GET /api/v1/dashboard/conversations` |
| `+` create conversation | `dashboard/components/LiveChat.tsx` (`createConversation`) | `POST /api/v1/dashboard/conversations` |
| Select conversation | `dashboard/components/LiveChat.tsx` (`openConversation`) | `GET /api/v1/dashboard/conversations/{id}/messages` |
| Send live agent message | `dashboard/components/LiveChat.tsx` (`sendMessage`) | `POST /api/v1/chat/conversations/{id}/messages` |
| Clear inbox for current bot | `dashboard/components/LiveChat.tsx` (`clearCurrentBotInbox`) | `DELETE /api/v1/dashboard/bots/{bot_id}/conversations` |
| Story save | `dashboard/components/VisualBuilder.tsx` (`saveFlow`) | `POST/PUT /api/v1/flows/{bot_id}/flows` |
| Story simulation | `dashboard/components/VisualBuilder.tsx` (`testFlow`) | client-side simulation |
| Canned responses load/save | `dashboard/components/CannedResponses.tsx` | `GET /api/v1/dashboard/{bot_id}`, `PUT /api/v1/dashboard/{bot_id}` |
| Small talk load/save | `dashboard/components/SmallTalk.tsx` | `GET /api/v1/dashboard/{bot_id}`, `PUT /api/v1/dashboard/{bot_id}` |
| Data collection load/save | `dashboard/components/DataCollection.tsx` | `GET /api/v1/leads/forms/{bot_id}`, `POST /api/v1/leads/forms` |

## Automated Pytest Coverage (Executed)

Command:

```bash
cd backend && ./venv/bin/pytest -q \
  tests/test_live_chat_screen.py \
  tests/test_api.py::TestBotCRUD \
  tests/test_api.py::TestFlows \
  tests/test_api.py::TestLeads \
  tests/test_api.py::TestConversations \
  tests/test_api.py::TestChatFallbacks
```

Result: `27 passed` (0 failed)

### New live-chat test cases added

File: `backend/tests/test_live_chat_screen.py`

| ID | Test Case | Status |
|---|---|---|
| LC-001 | Inbox list is empty initially | Pass |
| LC-002 | `+` creates conversation for selected bot | Pass |
| LC-003 | Selecting conversation loads message history | Pass |
| LC-004 | Sending agent message persists and is retrievable | Pass |
| LC-005 | Clear inbox removes only current bot conversations | Pass |
| LC-006 | Clear inbox on unknown bot returns 404 | Pass |
| LC-007 | Cross-tenant conversation/message isolation enforced | Pass |

## Manual UI Checklist (Screen-level)

Use this for browser validation on `http://localhost:9101/?start=dashboard`.

| ID | Scenario | Expected |
|---|---|---|
| UI-001 | Open bot card `Configure` | Bot workspace modal opens with all 5 tabs |
| UI-002 | Switch between all tabs | Correct tab content renders without blank panel/error |
| UI-003 | Live Chat search input typing | List filters by user name/last message |
| UI-004 | Live Chat status filter (`all/new/open/pending/resolved`) | Only matching conversations shown |
| UI-005 | `+` in Inbox | New conversation row appears and gets selected |
| UI-006 | `Clear Inbox` + confirm | Current bot inbox becomes empty |
| UI-007 | Send message in selected conversation | Message bubble appears immediately and persists on reload |
| UI-008 | Story Builder `Save Story` | Success banner appears; re-open preserves saved flow |
| UI-009 | Story Builder `Simulation` | Test panel toggles; simulated bot response appears |
| UI-010 | Canned Responses create/edit/delete/toggle | Card list updates and survives tab switch |
| UI-011 | Small Talk create/edit/delete/toggle | Card list updates and survives tab switch |
| UI-012 | Data Collection save form | Save success message appears and loads after reopen |

