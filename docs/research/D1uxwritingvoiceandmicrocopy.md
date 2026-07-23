# D1 — UX writing, voice & microcopy

*Design-intelligence reference. Track D1 of the registry research map. Written to be read by the design agent before it writes a single word of interface copy, and by a human owner auditing that work.*

---

## 1. Scope line

This track owns **the words the tool writes into every generated UI variant**: the voice/tone system behind them (one constant voice; tone that flexes by context and the user's emotional state); naming things so users *recognize* them instead of decoding them; button and action labels; error messages; empty states; confirmations; toasts; onboarding copy; terminology consistency and glossaries; keeping implementation vocabulary out of user-facing text; copy length budgets and truncation strategy; and writing source strings that survive translation.

## 2. Boundary (what this track does **not** cover)

- **Where copy sits on the canvas** — label position relative to its field, line length, text-block spacing, a component's content anatomy → **A3 layout/anatomy** and **C1** (whichever owns that component's structure). D1 supplies and sequences the string; A3/C1 place it.
- **Screen-reader-only text, alt text, and other a11y announcements** (`aria-live` regions, `alt=""`, visually-hidden prefixes like GOV.UK's hidden "Error:") → **A5 Accessibility**. D1 writes the visible message and flags *where* a hidden prefix or live-region announcement is needed (§4.4); A5 owns the mechanism that exposes it.
- **The motion of a toast** — how it slides or fades in and out, its timing curve → **B1 Motion & animation systems**. D1 owns what the toast *says* and how long it stays legible/on-screen (§4.7); B1 owns how it *moves*.
- **State visuals** — the colour, icon, and border that signal an error/success/empty state → **B2 Interaction states & affordance**. D1 owns the words inside that state; B2 owns the paint around them.
- **Empty-state illustration or decorative image** → **D2** (visual-asset track). D1 owns the headline + body + action; D2 owns anything pictorial alongside it.
- **Out of scope for this general-purpose track entirely**: long-form editorial/marketing copy, page-level SEO/IA content strategy, and the mechanics of a translation pipeline (TMS, translation memory, human-review workflow). D1 stops at writing *localization-ready source strings* (§4.10) — executing the translation is not a UI-copy concern.

---

## 3. Executive rules (apply these before writing any string)

1. **Separate voice from tone before writing anything.** Voice is constant — pick **2–4 fixed personality traits** and stop; tone flexes by context and the user's emotional state but never breaks voice. Build a **voice chart**: rows = concepts, vocabulary, wordiness, grammar, punctuation, capitalization; columns = your named voice traits. When two writers disagree on a word, the chart rules, not taste. (Torrey Podmajersky, *Strategic Writing for UX*, O'Reilly 2019, as documented in [VTEX's voice chart](https://uxwriting.vtex.com/docs/principles/voice-chart/) and [Rachael Harwood's walkthrough](https://medium.com/@rachaelharwood_ux/voice-chart-put-one-in-your-ux-writing-toolkit-08965f0e3b3a); see §4.1.)
2. **Button/action labels are verb + object, 2–4 words, sentence case, active imperative.** Name the actual result — "Delete file," "Send invoice," "Create account" — never ship bare **Submit / OK / Yes / Continue / Learn more / Click here** when a specific verb-object pair exists. ([NN/g — UI Copy](https://www.nngroup.com/articles/ui-copy/): "no more than 2–4 words"; [UX Movement's 5 rules](https://uxmovement.com/buttons/5-rules-for-choosing-the-right-words-on-button-labels/); [Shopify Polaris](https://polaris-react.shopify.com/content/fundamentals): lead with the verb, "add apps" not "you can add apps.")
3. **Every error message is what happened → why (only if it helps) → how to fix**, in plain language, using the same field/task wording the user just saw. Never blame the user: ban **"invalid," "illegal," "forbidden," "error occurred," "sorry," "please,"** and humor from error copy. ([NN/g — Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/); [UK Parliament Design System — Writing error messages](https://designsystem.parliament.uk/how-tos/writing-error-messages/).)
4. **Split error copy by cause, not by taste**: an **instruction** for an empty/missing field ("Enter your first name"), a **description** for a violated constraint ("First name must be 35 characters or fewer"). ([GOV.UK Design System — error message](https://design-system.service.gov.uk/components/error-message/).)
5. **No raw error code, stack trace, or internal status string in the primary message.** Show the plain message first; put the code behind a collapsed "Show technical details" disclosure for support/bug-report purposes only. ([NN/g](https://www.nngroup.com/articles/error-message-guidelines/): "hide or minimize the use of obscure error codes.")
6. **Empty states have a fixed anatomy**: headline (action-oriented) + one-line body (context) + one primary action (verb+noun button), optionally paired with an illustration owned by D2. One primary CTA only. ([NN/g — Designing Empty States](https://www.nngroup.com/articles/empty-state-interface-design/); [Shopify Polaris — Empty state](https://polaris-react.shopify.com/components/layout-and-structure/empty-state).)
7. **"Nothing here yet," "you cleared everything," and "no results for your search" are three different empty states** — each needs its own headline, body, and action (create vs. restore vs. adjust-filters). Reusing one generic empty-state string across all three is a common, avoidable failure (§4.5).
8. **Reserve confirmation dialogs for high-cost or hard-to-reverse actions**; prefer undo over confirm wherever the action *can* be undone. State the specific consequence instead of "Are you sure?"; label buttons with the **verb outcome** ("Delete file" / "Keep file"), never bare Yes/No; never default-focus the destructive option. ([NN/g — Confirmation Dialogs](https://www.nngroup.com/articles/confirmation-dialog/).)
9. **For catastrophic, irreversible actions, require a non-standard confirmation** — typing the item's name or the word DELETE — rather than a single click; a click is too cheap a price for data that can't come back. ([NN/g](https://www.nngroup.com/articles/confirmation-dialog/), citing Mailchimp's list-deletion pattern.)
10. **Choose the surface by scope and blocking-ness, not habit.** Toast = passive, system-caused, non-blocking, ≤3 lines, auto-dismiss; inline = tied to one field/row, persists until resolved, ≤2 lines; banner = system/page-wide, not task-specific; dialog = blocks flow, forces a decision (reserve for rule 8's cases). Never let a toast be the *only* record of something the user needs later. ([Carbon Design System — Notification pattern](https://carbondesignsystem.com/patterns/notification-pattern/).)
11. **One concept, one word, everywhere.** Enforce it with a living glossary (term → definition → approved synonyms if any → example sentence) and kill synonym drift (delete/remove/trash/discard for the same action). Speak the user's word, not the system's — never make users recall an internal label they were never shown. ([NN/g — Match Between the System and the Real World](https://www.nngroup.com/articles/match-system-real-world/): "speak the users' language... rather than system-oriented terms"; [NN/g — Recognition vs. Recall](https://www.nngroup.com/articles/recognition-and-recall/).)
12. **No implementation vocabulary in user-facing copy** — no `null`, `404`, `API`, database/table/column names, boolean flag names (`isActive`), enum constants (`STATUS_PENDING`), or HTTP verbs. Translate every internal state into the real-world concept it represents (lookup table in §4.2).
13. **Hold plain-language numbers as defaults**: **6th–8th-grade** reading level for general audiences (Shopify targets 7th; 10th–12th only for expert/professional tools, never above 12th); sentences **≤15–20 words** as a target, flag anything over **25 words** for a rewrite; paragraphs **≤5 sentences**. ([NN/g — Plain Language Is for Everyone](https://www.nngroup.com/articles/plain-language-experts/); [GOV.UK — clear language](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/tone-of-voice/clear-language); [Shopify Polaris](https://polaris-react.shopify.com/content/fundamentals).)
14. **Truncate on a character budget, not by accident.** Never cut below ~4 meaningful characters; pair an ellipsis with the full string on hover/focus only for strings under **~150 characters** — beyond that, use an expandable row/panel instead of a tooltip. Never truncate an identifier, price, date, or nav label a user needs to *distinguish* items by. ([PatternFly — Truncation](https://www.patternfly.org/ux-writing/truncation/).)
15. **Write source strings as if they will be translated, because they will be**: one full sentence per parameterized string (never assemble a sentence from concatenated fragments around a variable), real **ICU MessageFormat** plural categories (`zero/one/two/few/many/other`), and a **+30–40% length budget** (up to **2×** for German/Finnish compounds) — a button that just fits the English verb will not fit the translation. ([Unicode ICU — Formatting Messages](https://unicode-org.github.io/icu/userguide/format_parse/messages/); [Microsoft Learn — String concatenation](https://learn.microsoft.com/en-us/globalization/internationalization/concatenation).)

---

## 4. Body

### 4.1 Voice vs. tone — building the system, not vibes

**Voice is who you are; tone is how you say it right now.** Mailchimp's canonical framing: *"You have the same voice all the time, but your tone changes"* — the same person talks differently to a friend than to their boss. ([Mailchimp Content Style Guide — Voice and Tone](https://styleguide.mailchimp.com/voice-and-tone/).) Intuit frames it almost identically: *"Voice is who we are. It defines our relationship with our customers,"* while *"Tone is based on the mood of our customers."* ([Intuit Content Design — Voice and tone](https://contentdesign.intuit.com/voice-tone/).)

**Cross-guide comparison** — four organizations' primary content style guides, read directly:

| Source | Voice defined as (constant) | Tone defined as (flexes) | A concrete, numeric rule |
|---|---|---|---|
| [Mailchimp](https://styleguide.mailchimp.com/voice-and-tone/) | Plainspoken, genuine, a "translator" of jargon, dry humor | Shifts by reader's emotional state; *"always more important to be clear than entertaining"* | [5 writing goals](https://styleguide.mailchimp.com/writing-principles/): empower, respect, educate, guide, speak truth |
| [Intuit](https://contentdesign.intuit.com/voice-tone/) | Product-specific traits (e.g. QuickBooks "warm, confident, genuine") under one brand umbrella | *"Based on the mood of our customers"* — read the room per product/moment | [8 usage rules](https://contentdesign.intuit.com/style-and-usage/our-principles/) incl. active voice, simple tenses, "talk to your friends" |
| [Shopify Polaris](https://polaris-react.shopify.com/content/fundamentals) | Human, merchant-facing, plain — *"write like merchants talk"* | Implicit: *"Read it out loud. Does it sound like something a human would say? Ship it."* | 7th-grade reading level target; cut words aggressively ("+ Add" → "+") |
| [GOV.UK / GDS](https://www.gov.uk/service-manual/design/writing-for-user-interfaces) | Government "speaking" — approachable, not overly familiar | Adjusts per service, but never humorous in errors: *"people often use government services for serious things"* | Sentences flagged **>25 words**; paragraphs **≤5 sentences**; must/need/can tiering for legal obligation |
| [PatternFly / Red Hat](https://www.patternfly.org/ux-writing/brand-voice-and-tone/) | 4 named traits, each a tension pair (e.g. *"Helpful but humble"* → Friendly) | 3-question diagnostic: what does the user *need*, *think*, *feel*? | Casual for a blog, professional for a failure, informative+supportive for new UI |

**The voice chart, in full.** Podmajersky's tool (as reproduced by practitioners citing the book directly) is a table: **columns are your named voice traits**, **rows are six decision points** — *concepts, vocabulary, wordiness, grammar, punctuation, capitalization* ([VTEX UX Writing Guidelines](https://uxwriting.vtex.com/docs/principles/voice-chart/); [Rachael Harwood, "Voice chart: put one in your UX writing toolkit"](https://medium.com/@rachaelharwood_ux/voice-chart-put-one-in-your-ux-writing-toolkit-08965f0e3b3a)). *Even as tone changes screen to screen, voice never does* — the chart is what keeps ten writers (or one AI generating a hundred screens) sounding like one person.

*Worked example — a filled voice chart for a general-purpose product with two traits:*

| Dimension | Trait: **Direct** | Trait: **Encouraging** |
|---|---|---|
| Concepts | Clarity, speed, user control | Progress, capability, momentum |
| Vocabulary | Plain verbs: send, delete, save, add | "You're set," "nice work," "almost there" |
| Wordiness | Short sentences, no filler words | Short sentences; warm, not verbose |
| Grammar | Active voice; imperative for actions ("Save changes") | Active voice; second person, present tense |
| Punctuation | Periods; no exclamation marks | One exclamation mark max, success moments only |
| Capitalization | Sentence case everywhere | Sentence case everywhere |

**Tone-shift matrix — the same voice, five emotional states.** Build this once per product; it is the operational bridge between "voice chart" and "what do I actually type into this error message":

| User emotional state | Typical trigger | Tone adjustment | What never changes (voice) |
|---|---|---|---|
| Neutral / task-focused | Browsing, reading, routine navigation | Default tone: efficient, plain | Chosen vocabulary, sentence-case rule |
| Confused / uncertain | Empty states, first run, unfamiliar form | Slower pace, more context, more reassurance | Same words for the same concepts |
| Blocked / frustrated | Error messages, failed payment, lost work | Calm, maximally concrete, **zero humor** | Never blames, never jokes ([GOV.UK](https://www.gov.uk/service-manual/design/writing-for-user-interfaces): avoid humorous error messages) |
| Anxious / high-stakes | Deleting data, paying money, irreversible confirms | Extra-explicit about the consequence; no cleverness | Same directness as everywhere else |
| Delighted / success | Task completion, first success, milestone | Warmer; personality/light humor allowed *if the voice chart allows humor at all* | Still the same brand words, same capitalization rules |

**Honesty flag:** Podmajersky's book text was not fetched directly (it is a commercial O'Reilly title, not freely web-hosted); the chart's structure above is corroborated by two independent practitioner sources that both explicitly cite the book, so the *structure* is reliable, but exact worked examples from the book itself should be treated as paraphrase, not verbatim reproduction.

### 4.2 Naming things users recognize — terminology, glossaries, and keeping implementation vocabulary out

**The governing heuristic:** *"The system should speak the users' language, with words, phrases, and concepts familiar to the user, rather than system-oriented terms... Never assume that our own interpretations and understanding of words or objects match those of our users."* ([NN/g — Match Between the System and the Real World](https://www.nngroup.com/articles/match-system-real-world/), Nielsen's heuristic #2.) This is also why unlabeled icons fail: *"The icons do not promote recognition: it's hard for users to recognize what those buttons might mean... having a label next to some of these icons would help."* ([NN/g — Recognition vs. Recall](https://www.nngroup.com/articles/recognition-and-recall/).) **Recognition beats recall** because it supplies more retrieval cues; a UI that requires users to *remember* an internal term (rather than recognize a real-world one shown to them) is doing recall's job with recognition's budget.

**Glossary entry template** (one row per concept, not per string — reuse across every screen the tool generates):

| Field | Worked example |
|---|---|
| Term | "Archive" |
| Definition (1 plain sentence) | Remove an item from active lists without deleting it; it can be restored later. |
| Approved synonyms | None — always "archive." |
| Banned synonyms in this product | *hide* (means something else: still active, just visually collapsed), *deactivate* (means a different state: blocks the item from being used), *disable* — each of those needs its own glossary row because it is a genuinely different concept. |
| Forms | Verb: "Archive"; status noun: "Archived"; past participle in context: "Archived on 12 Jul 2026." |
| Example strings | Button: "Archive project" · Toast: "Project archived" · Empty state: "No archived projects yet." |

**Enforcement, concretely:** the glossary is the single source of truth a generator (human or AI) checks *before* emitting a new string for an already-named concept. Two enforcement failure modes to design against: (1) **synonym drift** — a second writer/session invents "remove" for what the glossary calls "delete," producing two words for one action; (2) **overloaded reuse** — the same word is stretched to cover two different concepts (e.g., "Remove" used both for "delete permanently" and "unlink from this list") because no one checked whether the concept was already named. Both are silent until a user hits the inconsistency mid-task — audit by grep-style scan of all shipped strings against the glossary's approved-term list, not by memory.

**Implementation vocabulary must never reach the UI.** Every internal/technical term has a required user-facing translation:

| Implementation term (never show this) | Why it leaks | User-facing replacement |
|---|---|---|
| `null` / `undefined` | Programming-language concept | "Not set" / "No [X] added yet" |
| `404` | HTTP status code | "We can't find that page" |
| `500` / "Internal server error" | HTTP status code | "Something went wrong on our end. Try again in a few minutes." |
| API / endpoint / payload | Backend architecture term | Omit; describe the user-visible effect instead |
| Foreign-key / constraint violation | Database term | State the real-world rule it enforces: "You can't delete a customer with open orders." |
| `isActive`, `is_deleted` (boolean flag names) | Internal variable naming | "Active" / "Archived" |
| `STATUS_PENDING_REVIEW` (enum constant) | Internal code constant | "Pending review" |
| Timeout / `429` / rate limit | Infra term | "You're doing that too fast — wait a moment and try again." |
| Stack trace | Debug output | Hide entirely behind "Show technical details" (§4.4) |

### 4.3 Button and action labels — what makes a label concrete

**Formula:** **verb + object**, active imperative, sentence case, **2–4 words**. ([NN/g — UI Copy](https://www.nngroup.com/articles/ui-copy/): *"Use just enough text to accurately describe the command and include no more than 2–4 words"*; drop articles — *a/an/the* — to keep it scannable.) For state-toggle commands, use the adjective the element becomes rather than a verb: *Bold*, *Italic*, not "Make bold." When the affected object isn't obvious from the verb alone, add the noun: *Draw Table*, not bare *Draw*. ([NN/g — UI Copy](https://www.nngroup.com/articles/ui-copy/).)

**Specific beats generic — explicitly state what the click does, never rely on a generic affirmative:**

> *"Explicitly state what users are doing by pushing that button"* — e.g. use *Discard* instead of *OK* to reinforce the actual action. ([NN/g — UI Copy](https://www.nngroup.com/articles/ui-copy/).)

**Five wording rules (UX Movement), condensed:**

| Rule | What it means | Example |
|---|---|---|
| 1. Action verbs | Every label starts with a verb, not a generic yes/no | "Delete" not "Yes" |
| 2. Precise diction | Pick the verb whose real-world meaning matches the actual consequence | "Remove" (from a list) vs. "Delete" (destroy) — not interchangeable |
| 3. Task-specific language | Never use a content-free placeholder verb | "Submit" tells the user nothing about *what* is submitted |
| 4. Active imperative | Drop the subject/article; never instruct *around* the button ("click here") | "Send message," not "Click here to send" |
| 5. Sentence-style capitalization | Sentence case reads as an invitation; ALL CAPS/Title Case reads as formal or (for all-caps) harms dyslexic readers | "Add to cart," not "ADD TO CART" |

Source: [UX Movement — 5 Rules for Choosing the Right Words on Button Labels](https://uxmovement.com/buttons/5-rules-for-choosing-the-right-words-on-button-labels/).

**Match the user's own word for the task, and cut the preamble.** GOV.UK's UI-writing guidance: state the label as the thing itself, not a sentence about the thing — write **"Total cost,"** not "This is the total cost"; write **"Wrong password,"** not "You have entered the wrong password"; drop reflexive words like "now" — **"Apply,"** not "Apply now." ([GOV.UK Service Manual — Writing for user interfaces](https://www.gov.uk/service-manual/design/writing-for-user-interfaces).) Shopify Polaris pushes the same instinct further for high-frequency, low-ambiguity actions: when the icon alone is unambiguous, *let the icon do the talking* — a bare **"+"** instead of **"+ Add."** ([Shopify Polaris — Content fundamentals](https://polaris-react.shopify.com/content/fundamentals).)

**Worked example — vague label → concrete label:**

| Context | ❌ Vague | ✅ Concrete | Why |
|---|---|---|---|
| Save a form | "Submit" | "Save changes" | Names the actual result, not a generic HTTP-form action |
| Confirm a purchase | "OK" | "Place order" | States the commitment being made |
| Delete confirmation | "Yes" | "Delete file" | Removes the need to re-read the question to know what "Yes" agrees to |
| Continue a wizard | "Continue" (alone, no object) | "Continue to payment" | Tells the user *where* continuing takes them |
| Dismiss with no action | "Learn more" (when it's really "not now") | "Not now" / "Skip" | "Learn more" over-promises if it just closes the panel |
| Generic link cue | "Click here" | "Download the report" (as the link text itself) | The link text must be the promise — see [NN/g, "A Link Is a Promise"](https://www.nngroup.com/articles/link-promise/) |

### 4.4 Error messages — cause + remedy, never blame

**The formula, converged on independently by NN/g, GOV.UK, and Google:** state **what happened**, plainly and specifically; add **why** only if it helps the user act; always give **how to fix it**.

- NN/g: *"Concisely and precisely describe the issue"* → avoid generic messages like "An error occurred"; *"offer constructive advice"* rather than just stating the problem. ([NN/g — Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/).)
- Google (Chat apps): *"What went wrong. How the user can proceed toward their goal. How to get help."* — explaining *why* an error occurred "builds trust." ([Google — Write actionable error messages](https://developers.google.com/workspace/chat/write-error-messages).)
- UK Parliament / GDS: *"Error messages must explain to your user what went wrong and how to fix it."* Match the field/question's own language in the fix. ([UK Parliament Design System — Writing error messages](https://designsystem.parliament.uk/how-tos/writing-error-messages/).)

**Two shapes, chosen by cause** ([GOV.UK Design System — error message](https://design-system.service.gov.uk/components/error-message/)):

| Cause | Shape | Example |
|---|---|---|
| Field is empty/missing | **Instruction** (imperative) | "Enter your first name" |
| Field is filled but violates a constraint | **Description** (states the rule) | "First name must be 35 characters or fewer" |

**Banned words, with the reasoning, straight from GDS's writing guidance for error messages:**

| Banned | Why | Use instead |
|---|---|---|
| "invalid," "illegal," "forbidden" | Blames the user; adds no information about the actual problem | Name the exact rule that was violated |
| "An error occurred" / "unspecified error" | Zero information; not actionable | Say precisely what failed |
| "Sorry" | *"Does not help fix the problem"* | Omit — go straight to the fix |
| "Please" | *"Implies a choice"* the user doesn't actually have | State the instruction directly: "Enter…" not "Please enter…" |
| "Oops," humor generally | Trivializes what may be a serious task; stales on repeat viewing | Plain, calm, specific language |
| The word "field" | Causes repetitive, unhelpful phrasing ("This field is required") | Name the actual thing: "Enter your email address" |

Source: [UK Parliament Design System — Writing error messages](https://designsystem.parliament.uk/how-tos/writing-error-messages/); consistent with [NN/g](https://www.nngroup.com/articles/error-message-guidelines/): *"positive and nonjudgmental tone of voice."*

**Never clear the user's input, never show errors prematurely, always place the message next to its field *and* in a page-level summary if the form is long.** ([GOV.UK Design System — error summary](https://design-system.service.gov.uk/components/error-summary/): *"Always show an error summary when there is a validation error, even if there's only one"*; link each summary item to its field, and add a hidden **"Error:"** prefix before the message for screen-reader users — that hidden-prefix mechanism itself is owned by **A5**, but D1 is what decides the visible wording it prefixes.)

**No raw codes in the face.** Show the plain message; put any code, hash, or diagnostic string behind a collapsed disclosure ("Show technical details") so support and bug reports still have it. ([NN/g](https://www.nngroup.com/articles/error-message-guidelines/): *"Hide or minimize the use of obscure error codes or abbreviations; show them for technical diagnostic purposes only."*)

**Score before shipping.** NN/g's rubric grades an error message on 12 criteria across 3 dimensions, 1–4 points each:

| Dimension | Criteria (4 each) |
|---|---|
| **Visibility** | Close to the error's source · noticeable/redundant/accessible indicator · severity-appropriate treatment · never shown prematurely |
| **Communication** | Human-readable language · precise/concise description · constructive advice · positive, non-blaming tone |
| **Efficiency** | Guards against likely mistakes · preserves user input · minimizes correction effort · educates on how the system works |

Grade bands: **A (4.0–3.3)** "top-tier"; **B (3.2–2.5)** room for improvement; **C (2.4–1.6)** "not prioritizing users' needs enough"; **D (≤1.5)** "several significant deficiencies." Anything under a **B** gets rewritten before shipping. Source: [NN/g — An Error Messages Scoring Rubric](https://www.nngroup.com/articles/error-messages-scoring-rubric/), with real examples graded (Craigslist 2.08/D, Google Flights 3.17/B, J.Crew 3.67/A).

**Worked example 1 — turning a vague error into cause + remedy:**

| | Text |
|---|---|
| ❌ Before | "Error: 0x80070005. Operation failed. Please try again." |
| Diagnosis | Raw code in the face; no plain cause; "please" implies optionality; no path forward |
| ✅ Plain message (what the user sees) | **Can't upload "budget.xlsx" — you don't have permission to add files to this folder.** Ask the folder owner for access, or choose a different folder. |
| ✅ Technical disclosure (collapsed, opt-in) | "Show technical details" → `Error 0x80070005 (access denied). Include this code if you contact support.` |

**Worked example 2 — form validation, instruction vs. description:**

| | Text |
|---|---|
| ❌ Before | "Invalid input." |
| Diagnosis | "Invalid" blames without informing; doesn't say what format is expected |
| ✅ Empty field → instruction | "Enter your phone number." |
| ✅ Wrong format → description, with a model | "Phone number must include an area code, like 415-555-0100." |

### 4.5 Empty states — anatomy and the three (not one) empty states

**The fixed anatomy: headline + one-line body + one primary action**, optionally with an illustration (owned by D2). Shopify Polaris' component rules, read directly:

- Heading: *"action-oriented: encourage merchants to take the step required to activate."* ✓ "Create orders and send invoices" — ✗ "Orders and invoices" (a noun-only heading names the feature, not the next step).
- Body/subtitle: *"describe or explain what's in the empty state title"*; *"should be conversational: include articles such as the, a, and an"* (the body is allowed to read naturally — unlike the button).
- Action: *"use only one primary call-to-action button"*; button copy follows the same **{verb}+{noun}** rule as §4.3 — ✓ "Activate Apple Pay" over ✗ "Try Apple Pay" (name the real outcome, not a soft hedge); ✓ "Add menu item" over ✗ "Add a menu item" (drop the article the button doesn't need, even though the body keeps it).

Source: [Shopify Polaris — Empty state](https://polaris-react.shopify.com/components/layout-and-structure/empty-state).

**Why the anatomy matters — NN/g's 3 guidelines**, and how each maps to the anatomy:

| NN/g guideline | Maps to |
|---|---|
| **Communicate system status** — is this loading, errored, or genuinely empty? | The headline must disambiguate *why* it's empty before anything else |
| **Provide learning cues** — a "pull revelation" that teaches the feature | The body line |
| **Deliver a direct pathway** — a link/button to act immediately | The primary action |

Source: [NN/g — Designing Empty States in Complex Applications: 3 Guidelines](https://www.nngroup.com/articles/empty-state-interface-design/), citing examples like DataDog ("Star your favorites to list them here") and Loggly (two pathways: add a real log source, or explore demo data — i.e., the empty state itself can branch).

**Treat these as three different empty states, not one reused string** (a synthesis of the anatomy above applied to the distinct causes an empty view can have — flagged as pattern synthesis, not a single named source):

| Empty-state type | Cause | Headline should say | Action should be |
|---|---|---|---|
| **First-use** | Nothing has ever been created | What the user gets by creating one | "Create [thing]" |
| **Cleared** | User deleted/archived everything that existed | Where the missing items went | "Restore" / "View archive" (+ secondary "Create") |
| **No-results** | A search or filter matched nothing | That the *search*, not the data, is the reason | "Clear filters" / "Clear search" |
| **Blocked** | Can't load due to a permissions/connection/error state | The actual blocker, per §4.4's error formula | Whatever resolves the blocker (retry, request access) |

**Worked example — full empty state, three variants, one "Projects" list in a project-management SaaS tool:**

*First-use:*
> **Create your first project**
> Projects keep your tasks, files, and deadlines together in one place.
> [Create project]

*No-results (user searched "Q3 marketing"):*
> **No projects match "Q3 marketing"**
> Try a different keyword, or clear your filters to see all projects.
> [Clear filters]

*Cleared (user archived everything):*
> **All projects archived**
> Restore an archived project, or create a new one to get started.
> [View archive]  ·  [Create project]

### 4.6 Confirmations — when, and how to word them

**When:** *"Use a confirmation dialog before committing to actions with serious consequences — such as destroying users' work or costing large amounts of money."* Reversible actions are better served by **undo** than by a confirm dialog. Overusing confirmations trains users to click through them blind: *"if you cry wolf too many times, people will stop paying attention."* ([NN/g — Confirmation Dialogs Can Prevent User Errors (If Not Overused)](https://www.nngroup.com/articles/confirmation-dialog/).)

**How to word them — 8 guidelines, condensed to a table:**

| Guideline | Rule | Example |
|---|---|---|
| Specificity | Never ask a bare "Are you sure?" — state the actual consequence, in user terms | "This file will be permanently deleted and can't be recovered," not "Are you sure?" |
| Button labels | Verb-outcome pairs, never Yes/No | "Delete file" / "Keep file" |
| Progressive disclosure | Offer a "Tell me more" for extra context rather than bloating the main dialog | — |
| No default-yes | Never default focus/styling onto the destructive option | Default focus on "Keep file" |
| Non-standard confirmation for extreme risk | Require typing the item's name or a keyword | Mailchimp requires typing "DELETE" before removing a mailing list, and shows the subscriber count |
| Escape hatch for routine confirms | Offer "Don't ask me again" for genuinely low-risk, frequent actions | — |
| Name the object | Identify *which* item, especially in batch actions | "Delete 3 files: report.pdf, logo.png, notes.txt" — not "Delete these 3 items" |
| Reversibility framing | If the action is reversible, say so and prefer that framing over a scary confirm at all | "Archived items can be restored for 30 days" |

Source: [NN/g — Confirmation Dialogs](https://www.nngroup.com/articles/confirmation-dialog/). Good/bad examples cited there: Windows 10's single-file delete names the file (good); its multi-file delete says only "these 2 items" (bad, unspecific); YouTube's delete-video dialog doesn't name the video (bad).

**Worked example — destructive confirmation:**

| | Text |
|---|---|
| ❌ Before | Title: "Are you sure?" · Body: (none) · Buttons: [Yes] [No] |
| ✅ After | Title: **"Delete 'Q3 budget.xlsx'?"** · Body: "This file will be permanently deleted and can't be recovered." · Buttons: **[Delete file]** &nbsp;**[Keep file]** (default focus on Keep file) |

### 4.7 Toast vs. inline vs. banner vs. dialog — when each, and how long

**Decision table:**

| Surface | Scope | Blocks the user? | Persists until resolved? | Length budget | Use for | Don't use for |
|---|---|---|---|---|---|---|
| **Toast** | One action's outcome | No | No — auto-dismisses | 1 line typical, **hard cap 3 lines** | System-caused, passive feedback ("Invoice sent") | Anything the user must still act on; the *only* record of a critical event |
| **Inline** | One field/row | No | Yes, until the condition changes | **≤2 lines** | Feedback tied to a specific element (field error, row status) | Page-wide or app-wide state |
| **Banner** | Whole page/system | No (but persistent) | Yes, until dismissed or resolved | 1–2 sentences (typical practice — not independently numerically sourced) | System/product-wide notices not tied to one task | Per-field validation |
| **Dialog / modal** | Whole task | **Yes** | Yes, until a decision is made | Confirmation budgets from §4.6 | Forcing a decision before proceeding — destructive/high-stakes per rule 8 | Routine, low-stakes acknowledgements |

Source: [Carbon Design System — Notification pattern](https://carbondesignsystem.com/patterns/notification-pattern/): toasts "should not exceed three lines"; inline notifications should be kept "under two lines"; banners are for "general notifications for the product or system, not a specific task," placed at the top of the content area.

**Toast timing — one credible reference point, not a universal law:** Apple-style toast components default to auto-dismiss at **5 seconds**, with a **10-second maximum** for cases needing longer reading time; a toast should be used only when the surrounding UI isn't the user's current focus, never when input is required, and only one toast should be visible at a time — new ones replace old ones rather than stacking. ([Canva Apps SDK — Toast design guidelines](https://www.canva.dev/docs/apps/design-guidelines/toasts/); honesty flag: this is one product's documented implementation, not a cross-industry standard — cross-check against WCAG 2.2.1 "timing adjustable," which is **A5**'s domain, before hard-coding a duration.)

**The rule that actually matters:** a toast is *ambient* — it must never be the sole place critical information lives, because a screen-reader user, an inattentive user, or anyone who blinks will simply miss it (boundary: making the toast's disappearance perceivable to assistive tech is **A5**; D1's job is to never *require* the toast be seen). If the information matters after it's gone, it needs a persistent home — a notification center, an inline status, a log.

**Worked example — toast:**

| | Text |
|---|---|
| ❌ Before | "Success!" |
| ✅ After | "Invoice #1042 sent to billing@acme.com" &nbsp;[Undo] |

### 4.8 Onboarding copy

Onboarding is best modeled as **a chain of empty states** (§4.5) plus a **classification discipline** for what each string is actually for. NN/g's "3 I's of Microcopy" gives the classification: **Inform** (titles, headings, tooltips — "make informed decisions"), **Influence** (marketing-flavored, conversion-oriented — taglines, CTAs), **Interact** (button labels, placeholders, status — "the knowledge they need to interact with an interface"). ([NN/g — The 3 I's of Microcopy](https://www.nngroup.com/articles/3-is-of-microcopy/).) Onboarding text routinely tries to do all three in one sentence and fails at all of them; assign each string **one** primary job.

**Operating rules:**

- **One idea per screen.** A screen that both explains a concept and asks for input is asking the user to context-switch twice.
- **Outcome-first, not chrome-first.** Describe what the user *gets*, not where to click: "Projects keep your files organized" beats "Click the folder icon in the sidebar to see your projects" — the latter describes UI chrome that may move or that a screen reader user experiences completely differently (boundary: describing *where* something visually is → **A3/C1**; D1 avoids depending on visual position at all where possible).
- **Size discipline.** An onboarding step is either **microcopy** (<3 sentences) or **short-form** (2–3 paragraphs, one idea) per NN/g's copy-size taxonomy (§4.9) — never long-form.
- **Every step must earn its screen.** If a step doesn't change what the user does next, compress it into the empty state of the feature it's introducing rather than a separate interstitial.
- **Never trap required information in onboarding-only copy.** Anything the user needs later (a keyboard shortcut, a limit, a setting) belongs in stable, discoverable UI too — onboarding is usually seen exactly once.

**Honesty flag:** no single named primary source in this research pass treats "onboarding copy" as its own discipline with numeric rules the way error messages or empty states have one; the operating rules above are a synthesis of the empty-state anatomy (§4.5), the 3 I's framework (NN/g), and the copy-size taxonomy (§4.9) rather than a directly citable "onboarding copy" standard. Treat this subsection as informed synthesis, not a verified external rule set.

### 4.9 Copy length, the 3 sizes, and truncation strategy

**The 3 sizes of UX copy** (NN/g), by definition, not by feel:

| Size | Definition | Typical uses |
|---|---|---|
| **Microcopy** | Fewer than 3 sentences | Button/link labels, form-field instructions, error messages, tooltips |
| **Short-form** | 2–3 paragraphs, one main idea | Onboarding steps, product descriptions, longer summaries |
| **Long-form** | 3+ paragraphs, a coherent continuous unit | Help docs, policy pages, reports — out of this track's typical surface area |

Source: [NN/g — UX Copy Sizes: Long, Short, and Micro](https://www.nngroup.com/articles/ux-copy-sizes/). Within microcopy, NN/g's "3 C's" set the priority order when they conflict: **Clarity first** (deliver the key information usefully), **Concision second** (fits without truncation — note the explicit standard-length reference to *160 characters* for description-style microcopy), **Character third** (tone/personality — never at the cost of the first two). ([NN/g — The 3 C's of Informational Microcopy](https://www.nngroup.com/articles/3-cs-microcopy/).)

**Length-budget table, consolidated from every surface above:**

| Surface | Budget | Basis |
|---|---|---|
| Button / action label | 2–4 words (~15–25 characters) | [NN/g — UI Copy](https://www.nngroup.com/articles/ui-copy/) |
| Microcopy generally | < 3 sentences | [NN/g — UX Copy Sizes](https://www.nngroup.com/articles/ux-copy-sizes/) |
| Short-form (onboarding step, summary) | 2–3 paragraphs, one idea | [NN/g — UX Copy Sizes](https://www.nngroup.com/articles/ux-copy-sizes/) |
| Error — problem statement | 1 sentence, ≤ ~20 words | Derived from the sentence-length rule below |
| Error — remedy | 1 sentence, ≤ ~20 words | Derived, ditto |
| Toast | 1 line typical; hard cap 3 lines | [Carbon — Notification pattern](https://carbondesignsystem.com/patterns/notification-pattern/) |
| Inline notification | ≤ 2 lines | [Carbon — Notification pattern](https://carbondesignsystem.com/patterns/notification-pattern/) |
| Banner | 1–2 sentences | Typical practice — not independently numerically sourced; treat as a starting point |
| Tooltip | < 150 characters; longer → use an expandable panel, not a tooltip | [PatternFly — Truncation](https://www.patternfly.org/ux-writing/truncation/) |
| Empty-state headline | ~3–8 words | Inferred from Polaris examples, not an independently stated numeric rule |
| Empty-state body | 1 sentence (~90–120 characters) | Inferred, ditto |
| Confirmation question/statement | ≤ 12 words, must name the object | Derived from [NN/g confirmation examples](https://www.nngroup.com/articles/confirmation-dialog/) |
| Confirmation buttons | 2–3 words each | Derived from the verb-outcome rule (§4.6) |
| Sentence, body copy generally | ≤ 15–20 words target; **>25 words** triggers a rewrite | [NN/g — Plain Language](https://www.nngroup.com/articles/plain-language-experts/); [GOV.UK — clear language](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/tone-of-voice/clear-language) |
| Paragraph | ≤ 5 sentences | [GOV.UK — clear language](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/tone-of-voice/clear-language) |
| Reading level | 6th–8th grade general audience; ≤ 12th grade even for experts | [NN/g — Plain Language Is for Everyone](https://www.nngroup.com/articles/plain-language-experts/) |

**Truncation strategy — rules, not a menu:**

1. **Indicate truncation with an ellipsis (…)**; if the truncated text is part of a link, the ellipsis is part of the link too.
2. **Never leave fewer than ~4 characters** of the original string visible — below that, truncation communicates nothing.
3. **Don't truncate immediately before/after punctuation** — it becomes ambiguous whether the punctuation belongs to the content or the ellipsis.
4. **Give the user a way to see the whole string.** A tooltip is appropriate under roughly **150 characters**; beyond that, use an expandable row, a details panel, or an overlay instead — a tooltip that itself needs scrolling has failed.
5. **Decide the truncation point by where the *distinguishing* information lives.** If two items differ only in their last 10 characters (e.g., file versions, timestamps), truncating the end destroys the only useful signal — truncate the middle or the front instead.
6. **Never truncate:** navigation labels at any level, table column headings, identifiers/prices/dates a user needs to tell items apart, or any string carrying a warning/critical status.

Source: [PatternFly — Truncation](https://www.patternfly.org/ux-writing/truncation/).

### 4.10 Localization-aware writing

**Never concatenate a sentence around a variable.** Microsoft's globalization guidance states the failure mode precisely: *"Your resource file format might not guarantee the order of the strings... It would be difficult for translators to understand how to translate 'You have' or 'in your shopping cart' without any idea how these string fragments will be used."* Concatenation also breaks on: **pluralization** (languages don't just append "s" — Italian "1 articolo" / "2 articoli"; Russian has *three* plural forms: "1 товар / 2 товара / 5 товаров"), **punctuation** (Japanese uses "。", not "."), and **word order** (Japanese is subject-object-verb, not English's subject-verb-object). The fix: **parameterized, full-sentence strings** — `"Items in the shopping cart: {0}"` as one unit the translator controls completely, never assembled from pieces. ([Microsoft Learn — String concatenation](https://learn.microsoft.com/en-us/globalization/internationalization/concatenation); [Microsoft Learn — Message formatting](https://learn.microsoft.com/en-us/globalization/internationalization/message-formatting).)

**Use real plural categories, not an `if (count == 1)` check.** ICU MessageFormat defines **six** possible plural categories per [CLDR](https://unicode-org.github.io/icu/userguide/format_parse/messages/) plural rules — `zero, one, two, few, many, other` — and `other` is always required as the fallback. English only distinguishes `one`/`other`; many languages need more:

```
{itemCount, plural,
  =0   {You have no items.}
  one  {You have # item.}
  other {You have # items.}
}
```

The `#` token is replaced by the formatted number. For gendered or category-based branching (not quantity), use **select**, and nest select *outside* plural if you must combine them — it keeps full sentences intact for the translator:

```
{gender, select,
  male   {He will respond shortly.}
  female {She will respond shortly.}
  other  {They will respond shortly.}
}
```

Sources: [Unicode ICU — Formatting Messages](https://unicode-org.github.io/icu/userguide/format_parse/messages/) (the authoritative spec: *"If possible, use complex arguments as the outermost structure of a message, and write full sentences in their sub-messages"*); [FormatJS — ICU Syntax](https://formatjs.github.io/docs/core-concepts/icu-syntax/) for the worked syntax above.

**Budget for expansion.** English is one of the more compact languages for UI strings; almost everything else is longer. A commonly used rule of thumb — cited in the brief for this report and corroborated directionally by localization-tooling vendors — is **+30–40%** typical growth, with some language pairs (German, Finnish compounds) reaching **2×** for short strings:

| Language | Typical expansion vs. English | Note |
|---|---|---|
| German | +20–35% (short strings can expand further) | Compound nouns |
| Finnish | +20–30% | Agglutinative morphology |
| Dutch, French | +15–25% | — |
| Spanish, Italian | +15–20% | — |
| Portuguese, Russian, Polish | +10–25% | — |
| Japanese | −10% to +10% | Character-dense |
| Chinese | −20% to −10% | Character-dense |
| Korean | 0% to +15% | — |
| Arabic | +15–25% | Plus right-to-left layout impact |

**Honesty flag:** this table is sourced from a localization-tooling vendor blog ([SimpleLocalize — Why text expansion breaks your UI](https://simplelocalize.io/blog/posts/text-expansion-ui-localization/)), not a linguistics primary source — treat the percentages as directional planning numbers, not guarantees, and re-measure against real translated strings before finalizing a layout. **The layout consequence of expansion (reflow, wrapping, min-width vs. fixed-width) is not this track's job** — D1's responsibility stops at writing short enough, parameterized source strings and flagging expansion-prone languages; the responsive/reflow handling is **A5** (accessible reflow) and **A3/C1** (component layout).

**Avoid idioms and culture-bound metaphors** — "home run," "no-brainer," "ballpark figure," "low-hanging fruit" — none of these translate literally and machine/human translators either mistranslate them or must invent an equivalent, which drifts from your controlled voice. Prefer literal, plain statements of the same meaning; plain language (§4.9's reading-level rules) is also the most translation-friendly register by construction.

**Don't bake in grammatical assumptions.** A source string that only works because English happens to put the adjective before the noun, or doesn't inflect verbs by gender/formality, will silently break in languages that do. Keep sentence structure simple and let the `select`/`plural` constructs above carry the variation — don't try to solve it with string concatenation (this loops back to the first rule in this section).

---

## 5. Options catalogue — copy patterns by surface

Columns: **surface · formula · do · don't · length budget · pitfalls.**

| Surface | Formula | Do | Don't | Length budget | Pitfalls |
|---|---|---|---|---|---|
| **Button / CTA** | verb + object (+ qualifier only if the object is ambiguous) | Name the exact result: "Delete file," "Send invoice"; match the field/task's own words; sentence case | Ship bare Submit/OK/Yes/Continue/Learn more/Click here; write in ALL CAPS or Title Case as a default | 2–4 words (~15–25 characters) ([NN/g](https://www.nngroup.com/articles/ui-copy/)) | Verb-only labels with an ambiguous target ("Draw" vs. "Draw table"); two buttons on one screen sharing a verb with no distinguishing noun ("Save" + "Save as") |
| **Error** | what happened (plain, specific) + why (if it helps) + how to fix | Use instruction-shape for empty fields, description-shape for constraint violations; match field-label language; hide codes behind a disclosure | "Invalid/illegal/forbidden," "an error occurred," "sorry," "please," humor, clearing the user's input | Problem: 1 sentence ≤20 words. Remedy: 1 sentence ≤20 words | Showing errors before the user finishes the field (premature validation); message only at page-top, not next to the field; message doesn't match the label's wording |
| **Empty state** | headline (action-oriented) + 1-line body (context) + 1 primary action (+ optional illustration → D2) | Distinguish first-use / cleared / no-results / blocked with different copy; one primary CTA; verb+noun button | Noun-only headline ("Invoices"); two equally-weighted CTAs; reusing "No items" for every cause | Headline ~3–8 words; body ~1 sentence (~90–120 chars) | Same string for "nothing yet" and "no results for filter" — different fixes, same box |
| **Confirmation** | name the specific consequence + verb-outcome button pair | "Delete file" / "Keep file"; name the object being acted on; type-to-confirm for catastrophic+irreversible actions | Bare "Are you sure?"; Yes/No buttons; default focus on the destructive option; confirming routine/reversible actions | Question/statement ≤12 words; buttons 2–3 words each | Vague batch actions ("delete these 2 items" without naming them); confirmation fatigue from overuse killing attention to the ones that matter |
| **Toast** | what happened (past tense, 1 line) [+ optional single action: Undo/View] | Use only for passive, system-caused, non-blocking feedback; give critical info a persistent home elsewhere too | Put required/critical-only info in a toast; stack multiple toasts; use for anything needing a decision | 1 line typical; hard cap 3 lines; auto-dismiss ~5 s default / 10 s max (product-specific reference point, not a standard) | Disappears before it's perceived (screen reader / inattentive user) — boundary → A5; used as the *only* record of an event |
| **Onboarding** | 1 idea per screen; outcome-first instruction | Classify each string by its 3-I's job (Inform/Influence/Interact) and keep one per screen; use empty-state anatomy for "first run" | Multi-paragraph feature dumps; chrome-dependent instructions ("click the icon top-right"); a tour that blocks the real UI and is never revisitable | Microcopy (<3 sentences) or short-form (2–3 paragraphs, one idea) per step | Describes UI position instead of outcome; buries information the user will need again later and only shown once |
| **Tooltip** | one short clause of supplementary info the visible label can't carry | Use for truncation recovery and genuinely optional detail | Duplicate the visible label; hide required/critical instructions only in a hover-only affordance | < 150 characters; beyond that use an expandable panel/dialog | Essential info trapped behind hover-only access (keyboard/touch/SR users miss it — boundary → A5); tooltip patching over a bad label instead of fixing the label |

---

## 6. Failure modes — detect & fix

| Failure | How it looks / how to detect | Fix |
|---|---|---|
| Generic button label | Grep shipped strings for "Submit," "OK," "Yes," "Continue," "Learn more" used as the *only* label | Rewrite as verb+object naming the real result (§4.3) |
| Blame language in errors | Grep for "invalid," "illegal," "you forgot," "please," "sorry," "oops" | Apply the cause+remedy formula (§4.4); run the NN/g scoring rubric |
| Raw code in the user's face | Error text contains a hex code, stack trace, or `STATUS_*` constant | Move it behind a collapsed "Show technical details" disclosure |
| Missing remedy | Error states the problem but gives no next step | Add the "how to fix" clause; if none exists, that's a product gap, not a copy gap |
| Synonym drift | Same action has two+ labels across the product (delete/remove/trash for one thing) | Add/enforce a glossary entry (§4.2); scan shipped strings against it |
| Implementation vocabulary leak | UI shows `null`, `404`, `isActive`, an enum constant, or a DB term | Apply the lookup table in §4.2; never surface an internal name directly |
| Empty state with no action | Blank screen states there's nothing, offers no button/link | Add the anatomy's missing piece — a primary verb+noun action (§4.5) |
| One empty-state string for every cause | "No items" shown identically for first-use, cleared, and no-results | Split into the 3–4 distinct types with distinct headline/body/action (§4.5) |
| Confirmation fatigue | Every action — including reversible, low-cost ones — gets a confirm dialog | Reserve confirms for high-cost/irreversible actions; use undo elsewhere (§4.6) |
| Default-focused destructive action | Dialog's default/highlighted button is the destructive one | Default focus to the safe option; never default-yes on delete (§4.6) |
| Toast holds the only copy of critical info | User can't find out later what a toast said | Give it a persistent home (notification list, inline status) in addition to the toast (§4.7) |
| Critical data truncated | A price, date, or ID is cut off with no way to see the full value | Never truncate identifying/critical fields; if truncated, always pair with a full-value affordance (§4.9) |
| Concatenated localized sentence | Source string built from `"You have " + count + " items"` fragments | Rewrite as one parameterized ICU MessageFormat string with real plural categories (§4.10) |
| Hardcoded singular/plural | Code branches on `count == 1 ? "item" : "items"` only | Replace with ICU `plural` categories (`zero/one/two/few/many/other`) (§4.10) |
| Idiom that doesn't translate | "Ballpark figure," "no-brainer," "home run" appear in source copy | Replace with a literal, plain-language equivalent (§4.10) |
| Voice drift across screens | Error copy sounds formal, onboarding sounds casual, no shared vocabulary | Build/apply the voice chart (§4.1); check new strings against its six rows |
| Same tone for error and success | A failed payment gets the same exclamation-mark energy as a completed one | Apply the tone-shift matrix — zero humor under frustration, warmth only at success (§4.1) |

---

## 7. Pre-flight checklist (run before shipping any copy)

- [ ] A **voice chart** exists (2–4 traits × 6 rows: concepts, vocabulary, wordiness, grammar, punctuation, capitalization) and every string is checked against it, not against personal taste (§4.1).
- [ ] Tone shifts by the user's emotional state (confused / blocked / anxious / delighted) but voice — vocabulary, formality, humor policy — never does (§4.1).
- [ ] Every button/action label is **verb + object, 2–4 words, sentence case**; none are bare Submit/OK/Yes/Continue (§4.3).
- [ ] Every error message follows **what happened → why → how to fix**, uses instruction-vs-description correctly, contains none of the banned words, and preserves user input (§4.4).
- [ ] No raw error code, stack trace, or internal status string is visible without an explicit "show details" action (§4.4).
- [ ] Every error scores **B (≥2.5/4 average) or better** on the NN/g 12-point rubric (§4.4).
- [ ] Every empty state has **headline + 1-line body + 1 primary action**, and first-use / cleared / no-results / blocked are copy-distinct (§4.5).
- [ ] Confirmation dialogs exist only for high-cost/irreversible actions; buttons are verb-outcome pairs, never Yes/No, never default-focused on the destructive option (§4.6).
- [ ] Toast, inline, banner, and dialog are each used for their correct scope/blocking-ness, and no critical information lives *only* in a toast (§4.7).
- [ ] Onboarding strings are classified by primary job (Inform/Influence/Interact), one idea per screen, outcome-first not chrome-first (§4.8).
- [ ] A **glossary** (term → definition → approved/banned synonyms → example strings) exists and new strings are checked against it before shipping (§4.2).
- [ ] No implementation vocabulary (`null`, `404`, `isActive`, enum constants, DB terms) appears in user-facing text (§4.2).
- [ ] Every surface respects its **length budget** (§4.9); nothing is truncated below ~4 characters, without an ellipsis, or without a full-value affordance under ~150 characters.
- [ ] No source string is assembled by concatenating fragments around a variable; plurals use ICU `plural` categories, not an `if (count==1)` check (§4.10).
- [ ] Source strings are budgeted for **+30–40%** length growth (up to 2× for German/Finnish) and contain no untranslatable idioms (§4.10).
- [ ] Reading level sits at **6th–8th grade** for general audiences (≤12th even for expert tools); sentences flagged over **25 words**; paragraphs ≤5 sentences (§4.9, §3.13).

---

## 8. Open questions / unverified

- **Apple Human Interface Guidelines — Writing** ([developer.apple.com/design/human-interface-guidelines/writing](https://developer.apple.com/design/human-interface-guidelines/writing)) and the **Atlassian Design System — Writing style/guidelines** pages ([atlassian.design/content/writing-style](https://atlassian.design/content/writing-style/), [atlassian.design/content/writing-guidelines](https://atlassian.design/content/writing-guidelines/)) are JavaScript-rendered single-page apps that this research pass's fetch tool could not render into readable text. They are **not cited with specific claims** in this report as a result — treat their absence as a gap to fill at implementation time, not as evidence they disagree with anything above.
- **Material Design 3's "Writing" / text-truncation foundations page** ([m3.material.io/foundations/writing/text-truncation](https://m3.material.io/foundations/writing/text-truncation)) and the **legacy Material snackbar spec** ([m2.material.io/design/components/snackbars.html](https://m2.material.io/design/components/snackbars.html)) were also JS-blocked; Carbon Design System and PatternFly were used as open, successfully-fetched substitutes for notification/truncation numbers. If Material-specific figures are required, re-fetch with a JS-capable renderer.
- **Torrey Podmajersky's *Strategic Writing for UX*** is a commercial O'Reilly book, not freely web-hosted; the voice-chart structure in §4.1 is corroborated by two independent practitioner sources that explicitly cite the book ([VTEX](https://uxwriting.vtex.com/docs/principles/voice-chart/), [Rachael Harwood](https://medium.com/@rachaelharwood_ux/voice-chart-put-one-in-your-ux-writing-toolkit-08965f0e3b3a)), but no claim here should be read as a verbatim quotation from the book itself.
- **Text-expansion percentages by language** (§4.10) come from a localization-tooling vendor blog ([SimpleLocalize](https://simplelocalize.io/blog/posts/text-expansion-ui-localization/)), not a linguistics or W3C primary source. Treat as directional planning numbers; re-measure against real translated strings, and re-check CLDR plural-rule data per locale at implementation time since CLDR updates periodically.
- **Toast auto-dismiss timing (5 s default / 10 s max)** is sourced to one product's documented SDK ([Canva Apps SDK](https://www.canva.dev/docs/apps/design-guidelines/toasts/)), not a cross-industry standard. It should be reconciled with WCAG 2.2.1 "Timing Adjustable," which sits in **A5**'s domain, before being hard-coded.
- **"Onboarding copy" as a named discipline** (§4.8) lacks a single primary source with numeric rules comparable to error messages or empty states in this research pass; the operating rules given are a synthesis of NN/g's 3 I's framework, the empty-state anatomy, and the copy-size taxonomy. Flagged as informed synthesis, not a directly verified external standard.
- **Empty-state headline/body word-count budgets and banner length budget** in §4.9's table are inferred from the shape of examples in Shopify Polaris and Carbon documentation, not independently stated as numeric rules by those sources — marked inline in the table itself.

---

## 9. Sources

Primary / authoritative:
- [NN/g — Error-Message Guidelines](https://www.nngroup.com/articles/error-message-guidelines/)
- [NN/g — An Error Messages Scoring Rubric](https://www.nngroup.com/articles/error-messages-scoring-rubric/)
- [NN/g — Designing Empty States in Complex Applications: 3 Guidelines](https://www.nngroup.com/articles/empty-state-interface-design/)
- [NN/g — The 3 I's of Microcopy: Inform, Influence, and Interact](https://www.nngroup.com/articles/3-is-of-microcopy/)
- [NN/g — The 3 C's of Informational Microcopy](https://www.nngroup.com/articles/3-cs-microcopy/)
- [NN/g — UX Copy Sizes: Long, Short, and Micro](https://www.nngroup.com/articles/ux-copy-sizes/)
- [NN/g — UI Copy: UX Guidelines for Command Names and Keyboard Shortcuts](https://www.nngroup.com/articles/ui-copy/)
- [NN/g — Confirmation Dialogs Can Prevent User Errors (If Not Overused)](https://www.nngroup.com/articles/confirmation-dialog/)
- [NN/g — Recognition vs. Recall in User Interfaces](https://www.nngroup.com/articles/recognition-and-recall/)
- [NN/g — Match Between the System and the Real World](https://www.nngroup.com/articles/match-system-real-world/)
- [NN/g — Plain Language Is for Everyone, Even Experts](https://www.nngroup.com/articles/plain-language-experts/)
- [NN/g — UX Writing: Study Guide](https://www.nngroup.com/articles/ux-writing-study-guide/)
- [NN/g — 10 Usability Heuristics for User Interface Design](https://www.nngroup.com/articles/ten-usability-heuristics/)
- [GOV.UK Design System — Error message component](https://design-system.service.gov.uk/components/error-message/)
- [GOV.UK Design System — Error summary component](https://design-system.service.gov.uk/components/error-summary/)
- [UK Parliament Design System — Writing error messages](https://designsystem.parliament.uk/how-tos/writing-error-messages/)
- [GOV.UK Service Manual — Writing for user interfaces](https://www.gov.uk/service-manual/design/writing-for-user-interfaces)
- [GOV.UK content guidance — Clear language](https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/tone-of-voice/clear-language)
- [Shopify Polaris — Content fundamentals (voice, tone, writing rules)](https://polaris-react.shopify.com/content/fundamentals)
- [Shopify Polaris — Empty state component](https://polaris-react.shopify.com/components/layout-and-structure/empty-state)
- [Mailchimp Content Style Guide — Voice and Tone](https://styleguide.mailchimp.com/voice-and-tone/) ([source repo](https://github.com/mailchimp/content-style-guide/blob/master/02-voice-and-tone.html.md))
- [Mailchimp Content Style Guide — Writing Goals and Principles](https://styleguide.mailchimp.com/writing-principles/)
- [Intuit Content Design — Voice and tone](https://contentdesign.intuit.com/voice-tone/)
- [Intuit Content Design — Our principles](https://contentdesign.intuit.com/style-and-usage/our-principles/)
- [Unicode ICU — Formatting Messages (MessageFormat, plural, select)](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
- [Microsoft Learn — String concatenation (Globalization)](https://learn.microsoft.com/en-us/globalization/internationalization/concatenation)
- [Microsoft Learn — Message formatting (Globalization)](https://learn.microsoft.com/en-us/globalization/internationalization/message-formatting)

Reference / secondary:
- Torrey Podmajersky, *Strategic Writing for UX* (O'Reilly, 2019) — voice chart, as documented in: [VTEX UX Writing Guidelines — Voice Chart](https://uxwriting.vtex.com/docs/principles/voice-chart/); [Rachael Harwood — "Voice chart: put one in your UX writing toolkit"](https://medium.com/@rachaelharwood_ux/voice-chart-put-one-in-your-ux-writing-toolkit-08965f0e3b3a); [book review, UXmatters](https://www.uxmatters.com/mt/archives/2020/02/book-review-strategic-writing-for-ux.php).
- [PatternFly — Truncation](https://www.patternfly.org/ux-writing/truncation/)
- [PatternFly — Brand voice and tone](https://www.patternfly.org/ux-writing/brand-voice-and-tone/)
- [Carbon Design System — Notification pattern](https://carbondesignsystem.com/patterns/notification-pattern/)
- [Canva Apps SDK — Toast design guidelines](https://www.canva.dev/docs/apps/design-guidelines/toasts/)
- [Google — Write actionable error messages (Chat apps)](https://developers.google.com/workspace/chat/write-error-messages)
- [UX Movement — 5 Rules for Choosing the Right Words on Button Labels](https://uxmovement.com/buttons/5-rules-for-choosing-the-right-words-on-button-labels/)
- [NN/g — A Link Is a Promise](https://www.nngroup.com/articles/link-promise/)
- [FormatJS — ICU Syntax Guide](https://formatjs.github.io/docs/core-concepts/icu-syntax/)
- [SimpleLocalize — Why text expansion breaks your UI and how to fix it](https://simplelocalize.io/blog/posts/text-expansion-ui-localization/) *(vendor blog; expansion percentages are directional, not authoritative — see §8)*
