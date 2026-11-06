# ScopeKeeper

A local prototype for reviewing website scope changes. Python 3.10+ is sufficient. There are no app dependencies.

## Windows launch

Extract the ZIP and double-click **Start_ScopeKeeper.cmd**. Press Enter at the hidden key prompt for the labeled simulated demo. The launcher opens your default browser on localhost. Keep the launcher window open. To run the same command manually, use `py -3 app.py` from the extracted folder.

For live mode, enter a Hindsight Cloud key at the hidden terminal prompt, or set `HINDSIGHT_API_KEY` in the process environment before launch. The key is used server-side for the session. Use only fictional data. If initial retain fails, the launcher starts labeled simulation. If recall fails during live mode, the app returns Needs Review. Live Cloud verification is pending. Each live startup or reset creates a fresh fictional bank and leaves earlier remote banks intact. Local project state lasts until reset or app exit.

## Demo

1. Reset the fictional demo. Start a New Chat, click Use demo request, enter 2 hours, switch memory OFF and assess. Expect Needs Review with no project evidence.
2. Start a New Chat, reuse the same request and hours, switch memory ON and assess. Expect Billable and ₹3,000. Inspect the Oct 3 exclusion and Oct 10 one-time WhatsApp courtesy, including their IDs.
3. Expand Client-approved amendment, select Razorpay, confirm approval, and record it. Start a New Chat and use the same request with memory ON. Expect Included, the Oct 14 amendment, and no estimate.
4. Start a New Chat and enter “Can you add Stripe checkout?” Expect Billable. Try “Can shoppers pay directly on the website?” before approval to see the Oct 3 exclusion and afterward to see the provider question.
5. Reset again to clear the amendment and restore the original decision.

The original standalone integration remains available as `py -3 hindsight_check.py seed` followed by `py -3 hindsight_check.py verify` for a separate process with a configured key. Use a dedicated bank for that CLI. The app uses its own fresh banks.

## Implementation and verification

The app sends eligible requests to Hindsight in live mode. It verifies the project tag, project metadata, source document ID and returned source chunk against the approved registry before using evidence. Simulation uses a small deterministic matcher with explicitly simulated fact IDs. The verdict uses narrow website/payment rules and reply templates. It is intended for the scripted scope review, with ambiguous cases referred back for input.

Run `py -3 -m unittest -v` from the extracted folder. The suite checks localhost launch and the end-to-end simulated API flow, approval isolation, wrong-project and fabricated evidence, missing governing evidence, missing hours and rate, and the payment paraphrase. Live Cloud and Windows double-click execution need verification on the target laptop.

## Feature status

| Features | Status |
| --- | --- |
| 1, 3–6, 8–13 | Implemented and checked in simulation. Courtesy is the seeded, specific WhatsApp exception. |
| 2 | Live retain/recall implemented using the starter client. Live verification pending. Simulated retrieval tested. |
| 7 | Explicit client-approved Razorpay/Stripe amendment works within the running fictional session. |
| 14 | Partial. Razorpay and Stripe split into separate verdicts. Enter item-specific hours in separate reviews. |
| 15 | Pending. One fictional project and dedicated bank. |
| 16 | Implemented. Dated history in an expandable panel. |
| 17–19 | Pending. Pasted chat and upload review, change order workflow. |
| 20 | Partial. Missing or unverified governing evidence is handled. General approved-term conflict resolution is pending. |
| 21–25 | Pending. Revisions, deadlines, financial summary, shareable orders and versioned client approvals. |

Submission materials are in SUBMISSION_KIT.md.

## Upgrade verification

The app keeps its existing in-memory demo and HTTP adapter. The session ledger
records assessed requests and clears on reset or process exit. Dated deciding
sources are marked separately from context. Needs Review requests clarification
when evidence is unavailable, invalid or conflicting. The baseline snapshot is
in memory. See ROADMAP.md for the full coverage inventory.

**Offline Windows demo:** Double-click Start_ScopeKeeper.cmd and press Enter at
the hidden prompt, or run `py -3 app.py --simulate` in Command Prompt.

**Existing Docker setup:** In the directory with your working Hindsight Compose
configuration, run `docker compose up -d` and `docker compose ps`. In Command
Prompt in the ScopeKeeper directory, run the following, substituting your actual
loopback port if different:

```bat
set "HINDSIGHT_URL=http://127.0.0.1:8888"
py -3 hindsight_check.py seed
py -3 hindsight_check.py verify
Start_ScopeKeeper.cmd
```

The unchanged launcher enables its live path only when the API key environment
variable is set or the hidden prompt receives a nonempty value. If your local
server has authentication disabled, enter a harmless local-only placeholder
such as `local-only` at that prompt after setting the loopback URL. If it uses
authentication, enter the local credential privately. Verify the live mode
banner and repeat the manual New Chat sequence above, then use **Reset fictional
demo**. The standalone CLI verifies Hindsight retrieval, while the app sequence
verifies the verdict and amendment flow. Automated tests use simulated memory.
Cloud remains the pre-existing default when the URL is unset. Use simulation or
your explicit loopback configuration for local-only handling.

## Submission build additions

Choose a UTF-8 .txt file under Client message to load up to 4,000 characters
into the editable request box. Loading is local to the browser. Review the
text before assessing. Assessment uses the configured memory mode. Import and
assessment do not record amendments.

Open Session request ledger and click Download session CSV. The export contains
the date, item (for split requests), verdict, deciding document ID and deciding
fact ID. It omits client message text. Simulation uses simulated fact IDs.
Reset clears the session ledger and its export.

## Roadmap batch

The verdict appears in the browser tab title. Drafts show a live word count and
approximate reading time at 200 words per minute. Each evidence card can copy
its dated citation. The session ledger supports search and chronological order.

## Version 1.3 controls

Open Display and keyboard controls to enlarge text, enable high contrast, or
print the current review. Ctrl+Enter assesses from the request box and
Alt+Shift+N starts a new chat. Results include a verdict explanation and a
suggested email subject. Display preferences apply to the current page.

## Version 1.4 request workflow

Search Fictional project history by phrase, date or source ID. In the session
ledger, expand any request to star it, add notes and tags, or load the original
text back into the request box for a new assessment. The ledger can filter by
notes, tags and starred state. Annotations live in the active session and
clear on reset or shutdown. CSV exports still omit request text and notes.

## Version 1.5 archive

Use Archive request in the session ledger to hide an entry from the active
ledger and CSV export. Select Show archived requests to restore an entry
with its notes, tags and bookmark. Archive state clears with the session.

## Version 1.6

The session ledger shows active and archived totals and a verdict breakdown.
Use Display and keyboard controls to choose ISO, day-first or relative dates
in the ledger and project history. The request text and estimated hours are
saved in the current browser tab across reloads and cleared by New Chat or reset.
Undo reverses the most recent archive or restore action in the current tab.

Under Prepare your reply, append dated sources, add a confirmation-by line,
or use the manual pre-send checklist. These controls edit or review the draft
locally. Copy reply still works with the text currently in the editor.

## Version 1.7 workflow

Expand a ledger entry to track its stage and record dated delivery references.
Use Deferred as a parking lot and Unbilled delivered extras to review delivered
requests with a Billable verdict that have yet to be marked Billed. Stage and
proof are session data. Setting a stage does not amend the approved scope.

## Version 1.8 request planning

Expand a request to rate business value and urgency from 0 to 3, enter a
feasibility or risk note, and record up to ten assumptions. Save the plan and
select Priority in the ledger to sort by the sum, with newest requests first
on ties. These fields are session data and do not affect scope or pricing.

## Version 1.9 decision trail

Expand any ledger entry and open Decision trail for this request. Assessments
with identical request text are shown in chronological order, including memory
mode, verdict, estimate, and the dated evidence seen at assessment time.
The trail is session-only and clears on reset or shutdown.

## Version 1.10 evidence bundle

Open a ledger entry, expand Decision trail for this request and click Download
evidence bundle. The JSON includes the request and its dated assessments with
verdicts, memory modes and citations. It excludes private planning and ledger
annotations. Review request text and evidence before sharing the file.

## Version 1.11 dispute report

Use Download dispute report in a ledger entry's Decision trail to save a
plain-text timeline of assessments of that request. It labels memory mode
and distinguishes deciding sources from context. The report includes the
request text and evidence, so review it before sharing.

## Version 1.12 client summary

Open a ledger entry, expand Decision trail and select Client-friendly summary.
The editable summary explains the verdict in everyday language and includes
the deciding record's date and estimate when available. Copying it does not
send anything. The summary reflects that assessment, including older versions.

## Version 1.13 reply formats

Under Prepare your reply, select Standard, Short, Email, WhatsApp or (for
Billable verdicts) Two options, then click Use selected format. ScopeKeeper
asks before replacing an edited draft. Nothing is sent automatically.
Developer check from this folder: `node test_reply_formats.js`.

## Version 1.14 negotiation templates

Billable results offer a reduce, defer or charge negotiation reply and a
response to small-change objections. An optional-extra quote appears only
when an estimate exists. Each reply remains editable before copying.

## Version 1.15 reply tone

Use the Formal, Neutral or Warm slider under Prepare your reply, then click
Use selected format. The slider changes the opening while preserving the
assessment details. Email keeps the subject on its first line.

## Version 1.16 template library

Open Prepare your reply to search available templates by name or message
text. Preview the selected template with the current tone before applying it.
Searching and previewing leave the current draft intact.

## Version 1.17 chat intake

Open Try with your own chat for guidance. Drop a single UTF-8 .txt file onto
the intake drop area or use the file picker. The file is read locally into
the editable request box. Assessment remains a separate action and uses the
configured memory endpoint and the fictional project agreement.

## Version 1.18 contact redaction

Use Redact contact details before assessment to mask common email and phone
formats in the editable request. Masking runs in the browser and invalidates
the old result. Review for other identifiers manually. Previously assessed
requests remain in the session ledger.

## Version 1.19 onboarding and evaluation

Open Quick walkthrough for a guided run of the fictional approval scenario.
Use Ctrl+K or the Commands button to open the searchable command palette.
Assessment displays a loading placeholder and verdicts animate on entry when
reduced motion is off. Run `py -3 evaluate_verdicts.py` to evaluate verdicts and
deciding sources on six labeled fictional cases in simulation.

## Version 1.20 planning calculators

Open Planning calculators to estimate change costs using work hours, context
switching time, and an hourly rate. Enter agreed and used revision rounds to
see remaining rounds or overage. Record one round increments the used count.
These controls are session-only and do not affect scope verdicts.

## Version 1.21 schedule and hours budget

In Planning calculators, estimate calendar days added to the current finish
date and check the result against the agreed deadline. The model assumes
the change starts after planned work and uses capacity available every
calendar day, including weekends. The hours budget compares included and
consumed hours and flags overages.

## Version 1.22 warranty and support windows

Use the warranty date checker to compare an incident with the agreed date
window. It checks dates only. The support countdown uses the browser's local
date and updates once a minute while the page is open. End dates are inclusive.
Both tools take manual inputs and do not change project scope.

## Version 1.23 bundle quote planner

Enter one amount per line and choose a bundle discount and proposed advance.
The planner shows subtotal, discount, total, advance, and remaining balance.
All amounts use the selected currency. No exchange-rate conversion is applied,
and assessment estimates continue to use the fictional INR project rate.

## Version 1.24 project workbench and verdict image

Open Project workbench from the home page. It offers project-type scope
templates and scope-creep examples, an exclusions-first statement-of-work
builder, acceptance-check suggestions, a kickoff checklist, contract text
checks and line-by-line version comparison. It can draft amendments and
overdue reminders and keep dated consent and lessons-learned notes in the
current browser tab. Contract checks use English keyword and line patterns,
and the comparison ignores reordering. Drafts are separate from approval
records. The assessment panel can save a verdict card as a PNG.

## Contract review additions

The workbench accepts UTF-8 plain-text contracts up to 20,000 characters.
It extracts common included-work, exclusion and revision lines. The clause
gap score is the percentage of six clause categories missed by the text
patterns, not an assessment of enforceability. The scope summary keeps the
original excerpts and flags items to discuss. No contract text is sent to
the server by these workbench tools.

## Workbench billing planner

Compare a fixed project fee with a monthly retainer, estimate work from
separate design/development/support rates, and track actual receipts and
paid costs separately from projections. Actual entries live in the current
browser tab. All amounts use INR and do not affect scope decisions.

## Quote and milestone tracking

In Project workbench, enter a quote reference, a follow-up date, and milestone
amounts. Record whether the client accepted, declined, or has yet to reply,
and mark individual milestones as billed. Follow-up dates show due and
overdue alerts in the open workbench. No background notifications or messages
are sent. Tracker data stays in the browser tab and does not amend scope.

## Billable and courtesy work log

Log completed work by date and type. The workbench shows billable and
courtesy hours, estimated total courtesy value, and a report for a selected
month. Values are based on the manually entered INR rate. These are work-log
records, separate from payments, approvals and scope verdicts.

## Courtesy alerts and goals

The work log flags the third courtesy entry in the current tab and keeps the
alert visible while the count is at least three. Set a baseline month and a
percentage reduction target to compare logged courtesy hours against the
selected report month. The comparison reflects recorded entries so far.

## Weekly digest and recovered revenue

Select a digest start date to review the next seven calendar days of work-log
entries, including the start date. In the profit tracker, label a received
out-of-scope payment as such to include it in recovered revenue. Recovered
revenue is a subset of receipts and is counted only once in profit.

## Evidence integrity

Downloading an evidence bundle shows its SHA-256 checksum. Keep that checksum
separately, then verify the downloaded JSON from the project folder:

    py -3 evidence_integrity.py "path\to\scopekeeper-evidence.json" --expected CHECKSUM

The check ignores JSON formatting and key order. Without a separately trusted
checksum, a person who can edit both the bundle and the embedded checksum can
produce a matching file. The checksum does not prove author identity.

## Message signal scan

Paste one speaker's excerpt and select Client or Freelancer before scanning.
The browser highlights common English commitment, refund and escalation
phrases and displays the matching sentences. It uses phrase matching, so
check the surrounding context. A signal does not change scope or approval.

The message scan also labels common request, offer, approval and refusal
phrases. Client excerpts can flag urgency, appreciation or frustration and
separate bug language from change language. Mixed sentences are shown as
mixed. Labels are based on wording and do not affect the approval record.

The message scan flags verbal approval wording for written verification.
Under a ledger entry, Similar session requests ranks active requests by
word overlap. It omits exact repeats, which remain in the decision trail.
Loading a match fills the editor without submitting an assessment.

## Amendment proposal status

Mark a fictional Razorpay or Stripe proposal pending or declined from the
amendment panel. Those labels do not affect assessment. Only the explicit
client-confirmation checkbox and Record Client-Approved Amendment action
can record approval. Proposal tracking cannot downgrade recorded approval.

## Scope-item timeline

Open Fictional project history and select a scope item. Records appear in
date order with motion disabled when the browser requests reduced motion.
An approved checkout amendment shows the affected provider, the earlier
agreement, and why the exclusion is superseded for that provider only.

## Pinned clauses and evidence coverage

Pin records in project history and turn on Pinned records only to find them
quickly. Pins last until reset or shutdown. The evidence coverage meter
distinguishes a deciding record, context-only evidence, and no evidence.
It describes retrieval coverage, not the probability a verdict is correct.

## History cutoff and fresh-chat recheck

Set Show records through in project history to hide later records. The cutoff
is inclusive and changes the timeline view only. In the ledger, New Chat and
recheck with memory clears the editor, loads the selected request and its
estimated hours, then makes a new assessment with memory enabled. It uses
the current project session and current approvals.

## Memory comparison and partial inclusion

Compare memory on vs off explicitly runs both assessment modes for the same
request and hours, without adding ledger entries. In live mode the on side
uses the configured Hindsight endpoint. Mixed included/billable checkout
items show a partial-inclusion heading and retain individual verdicts.

## Deciding sentences and verdict support

On the fictional project, the assessment highlights the sentence in the
deciding source that states the scope rule. The verdict support explanation
describes how directly the retrieved text supports the result. It is
qualitative and does not estimate the probability a verdict is correct.

## Manual verdict override

In a ledger entry, open Record a manual verdict, choose the assessed item,
and enter a verdict and reason. ScopeKeeper appends the human decision to
the session audit and includes it in evidence and dispute exports. The
original automated result, estimate, and approved project scope remain intact.

## Dispute and case study drafts

The workbench can format user-provided positions and agreed facts into a
neutral dispute summary and turn a challenge, action, observed result and
lesson into an editable case study. The time-saved estimator uses manually
entered before/after times and the number of comparable requests. It does
not measure usage automatically or invent project outcomes.

## Client coordination

Keep a per-client stakeholder register with roles and approval authority.
The authority checker warns about unverified or unauthorized names based
on your entries. The send-time planner suggests the next weekday at 9 AM
in the client's IANA time zone and shows the equivalent device time.
The register is tab-local and does not change project approval rules.

## Milestone 150 import and drafting tools

Import UTF-8 email exports (.eml) and WhatsApp text exports without media.
Email parsing runs on the local server, extracts plain-text bodies and
omits attachments. WhatsApp import recognizes common timestamped sender
lines in the browser. For longer imports the editor loads the last 4,000
characters and tells you when it does so. Review before assessment.
The workbench adds an editable change-request draft and a Markdown
statement-of-work download for manual import into Notion. It does not
connect to your Notion account. The assessment empty state has an illustration.

## Request activity heatmap

Open the session ledger and expand Request activity heatmap to see active
assessments by primary request category and date. The categories use keyword
matching and show the last 14 dates with activity. Archived assessments
are excluded. Rechecks count as separate assessments.

Edited replies are saved in the current browser tab and restored after the
same request and hours are reassessed with matching verdict and evidence IDs.
New Chat or demo reset clears the saved replies. Keep sensitive text out of
the demo.

The local message scan normalizes supported demo feature, platform and
vendor names. The session ledger displays a scope health ring for the
fictional client based on active items with a conclusive verdict. This
percentage measures assessment coverage.

The workbench includes a tab-local deliverable register with editable status
and acceptance criteria. The matcher suggests a unique close match based on
word overlap and asks for manual review when matches are weak or tied.

The workbench project setup wizard stores client, project, start date, hourly
planning rate, and a client accent in the current browser tab. Choose a saved
profile and apply it to prefill selected draft fields. The workbench accent
follows the selected profile. The fictional project assessment is unchanged.

The workbench remembers up to five recently applied client/project profiles.
Use a recent button to select a profile, then apply it to draft fields.
The Give feedback button prepares a plain-text download for manual sharing.

Use Upwork or Fiverr paste mode to remove recognized leading navigation
headers, preview and edit the excerpt, then copy it into the assessment
editor. It works locally on pasted text without account access.

When a matching deciding record has a missing or invalid date, the assessment
asks for the date on the original record and withholds a scope verdict. This
does not assign a date or edit project history.

The message scan flags references to earlier scope and can open matching
active session assessments for comparison. Matches use word overlap, and
the underlying agreement still requires separate verification.

Run guided demo opens a three-step simulated walkthrough for Razorpay and
Stripe. It uses an isolated fictional project and does not modify current
approvals or add assessments to the session ledger.
