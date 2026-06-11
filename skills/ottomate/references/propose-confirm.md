# Stage 4 Propose & Confirm — Lock-In Gate Prompt

Used in Stage 4 sub-step 4.3. After the classifier extracts items, this is what the user sees BEFORE any code changes happen.

## Tracker UI rendering

The tracker renders the structured items as a "Pending Approval" panel on the iteration page. Format:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ITERATION #N — Project: <slug>                                          │
│  Submitted: <timestamp>  ·  Status: PENDING APPROVAL                     │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [▾ ORIGINAL MESSAGE (click to expand)]                                  │
│  "the search is broken and we need a dashboard. also when I click..."    │
│                                                                          │
│──────────────────────────────────────────────────────────────────────────│
│                                                                          │
│  EXTRACTED ITEMS — review before locking                                 │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ ITEM 1                                       [edit] [split] [✗]    │  │
│  │ Type: BUG                              Confidence: 0.95  ✅        │  │
│  │ Title: Search returns empty results                                │  │
│  │ Affects: flow-search-add  ·  feat-search                           │  │
│  │ Description: User reports search field returns no results when    │  │
│  │   typing valid terms; expected behavior is filtered list.         │  │
│  │ Severity: major                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ ITEM 2                                       [edit] [split] [✗]    │  │
│  │ Type: NEW FEATURE                     Confidence: 0.62  ⚠ LOW      │  │
│  │ Title: Dashboard page                                              │  │
│  │ Affects: (new page) page-dashboard                                 │  │
│  │ Description: User asked for a dashboard view. Specific content    │  │
│  │   not detailed.                                                    │  │
│  │                                                                    │  │
│  │ ⚠ Low confidence — Please confirm:                                 │  │
│  │   "Did you mean a NEW page, or a metrics widget on existing       │  │
│  │   home page?"                                                      │  │
│  │   [ NEW PAGE ]  [ METRICS WIDGET ON HOME ]  [ I'll edit ]          │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ ITEM 3                                       [edit] [split] [✗]    │  │
│  │ Type: PAGE_MODIFICATION              Confidence: 0.88              │  │
│  │ Title: Click on result card opens detail view                      │  │
│  │ Affects: page-search  ·  component-result-card                     │  │
│  │ Description: When user clicks a result, navigate to detail page   │  │
│  │   for that item. Current behavior: click does nothing.            │  │
│  │ Severity: minor                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  REJECTED EXCERPTS (for transparency):                                   │
│  - "this app is so frustrating sometimes"                                │
│    Reason: User frustration; no specific item identified                 │
│                                                                          │
│  ─────────────────────────────────────────────────────────────────────   │
│                                                                          │
│  ACTIONS:                                                                │
│   [ + Add item I missed ]                                                │
│   [ ✓ Lock & build ]                                                     │
│   [ ↺ Re-classify ]                                                      │
│   [ ✗ Cancel iteration ]                                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

## Chat-mode rendering

If Stage 4 is running in direct Claude chat (no tracker), the skill renders the same structure as a text summary and uses `AskUserQuestion` for actions:

```
I extracted 3 items from your message. Here's the summary:

1. [BUG, 0.95] "Search returns empty results" — affects flow-search-add
2. [NEW FEATURE, 0.62 LOW] "Dashboard page" — confirm: new page or widget?
3. [PAGE_MOD, 0.88] "Click result opens detail" — affects page-search

Rejected: "this app is frustrating sometimes" (no specific item)

Use AskUserQuestion to:
- Resolve clarifications (item 2)
- Approve all / Edit list / Cancel
```

## User actions handled

| Action | Backend behavior |
|---|---|
| **Edit item** | Open editor for that item's fields (title, description, target, proposed_change). Save → update item in DB, recompute confidence if structural changes. |
| **Split item** | Item becomes 2+ items. User specifies how to split (e.g., title 1 + title 2). Original deleted. |
| **Merge items** | Multiple items combine into one. User picks which to keep. |
| **Reject item** | Remove from list. Logged in `rejected_items` audit. |
| **Add new** | User types a new structured item directly. Confidence: 1.0 (user-authored). |
| **Re-classify** | Re-run classifier with same input + user feedback. Useful if extraction missed major items. |
| **Lock & build** | Items list committed. Iteration moves to 4.4 (route). |
| **Cancel iteration** | Discard all extracted items. `reports.status = ignored`. No code changes. |

## Confidence resolution rules

- Any item with confidence < 0.7 BLOCKS lock & build until resolved (user must edit, split, or confirm)
- Confidence ≥ 0.7 items can be locked as-is
- After user edits an item, confidence becomes 1.0 (user-authored override)

## Hard rule: no code before lock

The skill MUST NOT proceed past 4.3 without an explicit lock action from the user. If the user asks "just go ahead and build" without locking, the skill responds:

```
I need you to confirm the items list first — even just clicking "Lock & build"
is enough. This is the anti-gaslighting checkpoint that ensures we build what
you asked, not what I guessed.
```

## Time-out behavior

If user doesn't lock within a reasonable window (default: 1 hour of inactivity), the iteration is marked `pending_user_review` in tracker. Notification sent. NOT auto-locked. Always requires explicit user action.

## Audit trail

Every lock-in event captures:
- Original raw text
- Initial classifier output (pre-edits)
- User edits (diff per item)
- Final locked list
- Timestamp + session_id

Stored in `iterations.lock_in_audit` JSON column. Visible in trace report at 4.8.

## Why this prompt is critical

This is THE bridge between user intent and Claude's work. Without it, every iteration becomes "Claude inferred + Claude built + Claude claimed" with the user unable to verify what was extracted.

With it, every iteration is "user confirmed extracted items + Claude built locked items + Claude reports per-item evidence". Verifiable end-to-end.

**Anti-gaslighting depends on this prompt being followed strictly.** No shortcuts.
