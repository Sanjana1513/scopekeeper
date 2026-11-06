# ScopeKeeper roadmap

Statuses describe the packaged fictional prototype. Planned integrations require a separate privacy or hosting decision when they would transmit client data.

| ID | Idea | Status | File or reason |
| --- | --- | --- | --- |
| 1 | Dated timeline per scope item | Implemented | app.py and index.html, fictional project history |
| 2 | "As of" date picker | Implemented | index.html, history cutoff only |
| 3 | Evidence cards with source icons | Implemented | index.html |
| 4 | Highlight the deciding sentence | Implemented | index.html, exact deciding sentence in fixture evidence |
| 5 | Verdict version history | Implemented | app.py and index.html, session decision trail |
| 6 | Link each amendment to the items it changed | Implemented | app.py and index.html, fictional project history |
| 7 | Show superseded evidence and why | Implemented | app.py and index.html, fictional project history |
| 8 | Pin golden clauses | Implemented | app.py and index.html, session history pins |
| 9 | Auto-tag messages (request/offer/approval/refusal) | Implemented | index.html, English message scan |
| 10 | Detect verbal approvals mentioned in chat | Implemented | index.html, manual review tools |
| 11 | Mark approvals client-confirmed vs assumed | Implemented | app.py and index.html, explicit confirmation and separate proposal status |
| 12 | Memory search | Local equivalent | Search the app project history. General Hindsight bank search pending. |
| 13 | Per-client memory banks | Roadmap | Planned · outside this upgrade |
| 14 | Merge duplicate requests across channels | Partial | app.py and index.html · Flags matching active session requests; merging pending. |
| 15 | Evidence strength meter | Implemented | index.html, evidence coverage meter |
| 16 | Verdicts: Included, Courtesy, Billable, Needs Review | Local equivalent | app.py · Three working outcomes. Courtesy has no decision rule yet. |
| 17 | Abstain on thin evidence | Implemented | app.py |
| 18 | Confidence with plain-language reason | Implemented | index.html, qualitative verdict support explanation |
| 19 | Contradiction detector | Implemented | app.py |
| 20 | Ambiguity detector | Implemented | app.py |
| 21 | Partial-inclusion verdicts | Implemented | index.html, mixed checkout provider outcomes |
| 22 | Similar-request matching | Implemented | index.html, manual review tools |
| 23 | Flag bundled requests | Local equivalent | app.py · Recognizes a Razorpay/Stripe pair. |
| 24 | Split bundles into separate verdicts | Implemented | app.py |
| 25 | "What would change this verdict?" panel | Implemented | app.py |
| 26 | Counterfactual view | Implemented | app.py and index.html, memory-on/off comparison |
| 27 | Show the rule that fired | Implemented | app.py |
| 28 | Verdict audit log | Implemented | app.py and index.html, session decision trail |
| 29 | Human override with reason | Implemented | app.py and index.html, audit-only manual decisions |
| 30 | Learn from overrides | Roadmap | Planned · outside this upgrade |
| 31 | Tone slider | Implemented | index.html, Prepare your reply |
| 32 | Upsell mode with quote | Implemented | index.html, Billable reply formats |
| 33 | Courtesy mode | Roadmap | Planned · outside this upgrade |
| 34 | Cite dates and sources in replies | Implemented | index.html, Prepare your reply |
| 35 | Block claims not in evidence | Roadmap | Planned · outside this upgrade |
| 36 | Multi-language replies | Roadmap | Planned · outside this upgrade |
| 37 | Length toggle | Implemented | index.html, Prepare your reply |
| 38 | WhatsApp/email formats | Implemented | index.html, Prepare your reply |
| 39 | Polite deadline line | Implemented | index.html, Prepare your reply |
| 40 | Two-option replies | Implemented | index.html, Prepare your reply |
| 41 | Replies to "it's just small" arguments | Implemented | index.html, Billable reply formats |
| 42 | Template library | Implemented | index.html, searchable library with preview |
| 43 | Re-check edited reply against evidence | Roadmap | Planned · outside this upgrade |
| 44 | Subject line suggestions | Implemented | index.html |
| 45 | Reply quality checklist | Implemented | index.html, Prepare your reply |
| 46 | Hour estimate per request | Implemented | app.py |
| 47 | Price from user's rate | Implemented | app.py |
| 48 | Instant mini-quote PDF | Local equivalent | Workbench quote preview with browser Print / Save as PDF. Direct PDF generation pending. |
| 49 | Change request form | Implemented | workbench.html and workbench.js, editable change request draft |
| 50 | Bundle discounts | Implemented | index.html, bundle quote planner |
| 51 | Billable vs free tracker | Implemented | workbench.html and workbench.js, work log |
| 52 | Total value of courtesy work | Implemented | workbench.html and workbench.js, work log |
| 53 | Project profit tracker | Implemented | workbench.html and workbench.js, Billing planner |
| 54 | Late payment reminder drafts | Implemented | workbench.html and workbench.js |
| 55 | Milestone-linked billing | Implemented | workbench.html and workbench.js, quote tracker |
| 56 | Advance payment suggestion | Implemented | index.html, bundle quote planner |
| 57 | Currency support | Local equivalent | Bundle quote display only. Assessment remains INR. |
| 58 | Tax-ready billable export | Roadmap | Planned · outside this upgrade |
| 59 | Retainer vs fixed-price modes | Implemented | workbench.html and workbench.js, Billing planner |
| 60 | Quote acceptance tracker | Implemented | workbench.html and workbench.js, quote tracker |
| 61 | Upload contract and extract scope | Implemented | workbench.js, UTF-8 text upload and rule-based scope extraction |
| 62 | Deliverables checklist | Local equivalent | demo.json · Agreed items appear in the source text. No structured register. |
| 63 | Revision limits extraction | Implemented | workbench.html and workbench.js |
| 64 | Exclusions extraction | Implemented | workbench.html and workbench.js |
| 65 | Missing clause detection | Implemented | workbench.html and workbench.js |
| 66 | Contract risk score | Implemented | workbench.js, six-category clause gap score |
| 67 | Suggested clauses | Implemented | workbench.js, missing-category clause suggestions |
| 68 | Amendment generator | Implemented | workbench.html and workbench.js |
| 69 | E-sign link | Roadmap | Planned · needs integration or separate local-first design |
| 70 | Statement-of-work builder | Implemented | workbench.html and workbench.js |
| 71 | Compare contract versions | Implemented | workbench.html and workbench.js |
| 72 | Plain-English summary | Implemented | workbench.js, scope summary with original excerpts |
| 73 | Google Docs import | Roadmap | Planned · needs integration or separate local-first design |
| 74 | Email thread import | Implemented | index.html and app.py, local plain-text MIME extraction from UTF-8 .eml exports |
| 75 | OCR for chat screenshots | Roadmap | Planned · needs integration or separate local-first design |
| 76 | Colour-coded verdict badge | Implemented | index.html |
| 77 | Animated timeline | Implemented | app.py and index.html, fictional project history |
| 78 | Dark mode | Implemented | index.html |
| 79 | Glass-style cards | Implemented | index.html · Optional display setting with solid high-contrast cards. Browser visual check pending. |
| 80 | Scope Health ring per client | Implemented | index.html, active fictional client assessment coverage |
| 81 | Drag-to-add evidence | Local equivalent | Drop .txt files into request intake. Evidence attachment pending. |
| 82 | Before/after toggle | Implemented | index.html |
| 83 | Step-by-step onboarding | Implemented | index.html, walkthrough and assessment controls |
| 84 | Command palette (Ctrl+K) | Implemented | index.html, walkthrough and assessment controls |
| 85 | Mobile-first layout | Implemented | index.html |
| 86 | Skeleton loaders | Implemented | index.html, walkthrough and assessment controls |
| 87 | Verdict-change micro-animations | Implemented | index.html, walkthrough and assessment controls |
| 88 | Empty-state illustrations | Implemented | index.html, illustrated assessment empty state |
| 89 | Per-client brand colours | Implemented | workbench.html and workbench.js, client profile accent |
| 90 | Keyboard shortcuts | Implemented | index.html |
| 91 | WhatsApp import | Implemented | index.html, local WhatsApp text export import |
| 92 | Gmail | Roadmap | Planned · needs integration or separate local-first design |
| 93 | Slack | Roadmap | Planned · needs integration or separate local-first design |
| 94 | Notion export | Implemented | workbench.js, Notion-ready Markdown file for manual import |
| 95 | Calendar deadline sync | Roadmap | Planned · needs integration or separate local-first design |
| 96 | Trello/Jira tasks | Roadmap | Planned · needs integration or separate local-first design |
| 97 | Browser extension | Roadmap | Planned · needs integration or separate local-first design |
| 98 | Telegram bot | Roadmap | Planned · needs integration or separate local-first design |
| 99 | Razorpay/Stripe invoice generation | Roadmap | Planned · needs integration or separate local-first design |
| 100 | Zapier/webhooks | Roadmap | Planned · needs integration or separate local-first design |
| 101 | Discord | Roadmap | Planned · needs integration or separate local-first design |
| 102 | Upwork/Fiverr paste mode | Implemented | index.html, editable marketplace excerpt preview |
| 103 | Figma comment import | Roadmap | Planned · needs integration or separate local-first design |
| 104 | GitHub issue linking | Roadmap | Planned · needs integration or separate local-first design |
| 105 | CSV import/export | Local equivalent | Session ledger CSV export in app.py and index.html. CSV import pending. |
| 106 | Local-first mode (Hindsight in Docker) | Local equivalent | hindsight_check.py · Supports an explicitly configured local endpoint. Docker retest pending. |
| 107 | "Data never leaves your machine" banner | Roadmap | Planned · outside this upgrade |
| 108 | Encrypted storage | Roadmap | Planned · outside this upgrade |
| 109 | Redact personal data | Local equivalent | Manual email and phone masking in index.html. Other identifiers require manual review. |
| 110 | One-click delete client data | Roadmap | Planned · outside this upgrade |
| 111 | Exportable evidence bundle | Implemented | app.py and index.html, session decision trail JSON |
| 112 | Tamper-evident hashes | Implemented | Evidence SHA-256 export and independent verification via evidence_integrity.py |
| 113 | "Not legal advice" notice | Implemented | index.html |
| 114 | Local model option | Roadmap | Planned · outside this upgrade |
| 115 | Role-based sharing | Roadmap | Planned · needs integration or separate local-first design |
| 116 | Read-only client share link | Roadmap | Planned · needs integration or separate local-first design |
| 117 | Session timeout lock | Roadmap | Planned · outside this upgrade |
| 118 | Backup and restore | Roadmap | Planned · outside this upgrade |
| 119 | Consent notes for recorded calls | Implemented | workbench.html and workbench.js |
| 120 | Privacy score per project | Roadmap | Planned · outside this upgrade |
| 121 | Scope creep rate per client | Roadmap | Planned · outside this upgrade |
| 122 | Client risk indicator | Roadmap | Planned · outside this upgrade |
| 123 | Precedent drift alert (3rd free favour) | Implemented | workbench.html and workbench.js, courtesy log |
| 124 | Monthly "free work leaked" report | Implemented | workbench.html and workbench.js, work log |
| 125 | Best-performing replies | Roadmap | Planned · outside this upgrade |
| 126 | Request type heatmap | Implemented | index.html, session ledger activity heatmap |
| 127 | Weekly digest | Implemented | workbench.html and workbench.js, seven-day work-log digest |
| 128 | Client behaviour trends | Roadmap | Planned · outside this upgrade |
| 129 | Time saved estimate | Implemented | workbench.html and workbench.js, user-entered drafts and estimates |
| 130 | Revenue recovered counter | Implemented | workbench.html and workbench.js, out-of-scope receipts |
| 131 | Goal: reduce free work by X% | Implemented | workbench.html and workbench.js, courtesy log |
| 132 | Streaks for sending change requests | Roadmap | Planned · outside this upgrade |
| 133 | Case study generator | Implemented | workbench.html and workbench.js, user-entered drafts and estimates |
| 134 | Lessons learned per project | Implemented | workbench.html and workbench.js |
| 135 | Anonymous benchmarks (opt-in) | Roadmap | Planned · needs integration or separate local-first design |
| 136 | Hindi and Tamil interface | Roadmap | Planned · outside this upgrade |
| 137 | Voice input | Roadmap | Planned · needs integration or separate local-first design |
| 138 | Screen reader support | Partial | index.html · Labeled controls, status messages and skip link. Assistive technology verification pending. |
| 139 | High contrast mode | Implemented | index.html |
| 140 | Interactive guided demo | Implemented | index.html and app.py, isolated simulation walkthrough |
| 141 | Sample project with fictional data | Implemented | demo.json |
| 142 | Shareable verdict card image | Implemented | index.html, local PNG export |
| 143 | "Try with your own chat" quick start | Implemented | index.html, intake quick start |
| 144 | Landing page with 60-second pitch | Implemented | welcome.html, /welcome route and HTTP regression. |
| 145 | Beginner freelancer mode | index.html | Implemented · browser verification pending |
| 146 | Agency mode | Roadmap | Planned · outside this upgrade |
| 147 | Offline mode | Local equivalent | memory_adapter.py · Fictional offline mode. |
| 148 | Installable PWA | Roadmap | Planned · outside this upgrade |
| 149 | In-app feedback button | Implemented | workbench.html and workbench.js, local feedback report |
| 150 | Open roadmap page | Implemented | index.html |
| 151 | One unified intake box accepting pasted text, files, and screenshots | Local equivalent | Pasted text and UTF-8 .txt preview in index.html. Screenshot intake pending. |
| 152 | Project setup wizard (client, project, rate, start date) | Implemented | workbench.html and workbench.js, two-step tab-local profiles |
| 153 | Baseline scope snapshot: freeze the original agreed scope as version 0 | Implemented | app.py |
| 154 | Deliverable register: structured list of every deliverable with status | Implemented | workbench.html and workbench.js, tab-local deliverable register |
| 155 | Request-to-deliverable matcher mapping a request to the closest baseline item | Implemented | workbench.html and workbench.js, tab-local deliverable register |
| 156 | Step-by-step decision trace ("In baseline? Offered as courtesy? Amended later?") | Local equivalent | app.py / index.html · Shows the deciding source and reason. No full reasoning trace. |
| 157 | No-verdict-without-citation rule enforced in code | Implemented | app.py |
| 158 | Missing-date prompt: ask the user when evidence has no date | Implemented | app.py, verified matching source date prompt |
| 159 | Courtesy "consumed" state so a one-time favour cannot be reused silently | Roadmap | Planned · outside this upgrade |
| 160 | Amendment recording form (what changed, who approved, date, how approved) | Local equivalent | app.py / index.html · Confirmed provider and fixed demo date only. |
| 161 | Approval proof attachment (screenshot or email) on amendments | Roadmap | Planned · outside this upgrade |
| 162 | Fresh-session recall test button ("start new chat and re-check") to prove memory persists | Implemented | index.html and app.py, new chat within current project session |
| 163 | Hindsight connection health indicator | Local equivalent | index.html · Startup badge distinguishes simulation, loopback and remote endpoints. Ongoing health check pending. |
| 164 | Docker/Hindsight setup checker with fix hints | Roadmap | Planned · outside this upgrade |
| 165 | Fictional demo dataset loader with one-click reset | Implemented | app.py |
| 166 | Request ledger: every request with its verdict and date | Implemented | app.py |
| 167 | Regression test suite of golden scenarios (Razorpay/Stripe cases and more) | Implemented | test_scopekeeper.py |
| 168 | Graceful failure states (Hindsight offline, empty memory, malformed import) | Local equivalent | app.py · Handles failed recall and no evidence. Import absent. |
| 169 | Documented data schema and a `.env.example` config file | Implemented | README.md / .env.example |
| 170 | One-command start script (docker compose + app) | Local equivalent | Start_ScopeKeeper.cmd · Starts the app. Docker starts separately. |
| 171 | Consistent time zone handling for all dates | Roadmap | Planned · outside this upgrade |
| 172 | Duplicate-ingestion guard so the same message is never stored twice | Roadmap | Planned · outside this upgrade |
| 173 | Prompt-injection defence: client text is always treated as data | Implemented | app.py |
| 174 | Response-time progress indicator with a sensible timeout | Implemented | index.html · Elapsed assessment time. hindsight_check.py · Existing 120-second network timeout. Browser timing check pending. |
| 175 | Plain-language glossary tooltips for Included, Courtesy, Billable, Amended | Implemented | index.html |
| 176 | Pending-approval state for amendments (pending, approved, declined) | Implemented | app.py and index.html, demo amendment statuses |
| 177 | Promise detector: spots commitments the freelancer made ("I'll add that") | Implemented | index.html, English phrase scan with manual speaker selection |
| 178 | Implicit-scope detection for phrases like "as discussed" linked to the earlier thread | Implemented | index.html, phrase flags and links to related session excerpts |
| 179 | Client reflection summary: periodic "what we know about this client" from memory | Roadmap | Planned · outside this upgrade |
| 180 | Entity extraction and normalisation (features, platforms, vendors) | Implemented | index.html, supported demo entities in local message scan |
| 181 | Alias handling ("payment gateway" = "checkout") | Implemented | memory_adapter.py |
| 182 | Dependency awareness (request X depends on included item Y) | Roadmap | Planned · outside this upgrade |
| 183 | Effort-to-timeline impact: how many days a request delays delivery | Implemented | index.html, local planning calculators |
| 184 | Deadline impact warning | Implemented | index.html, local planning calculators |
| 185 | Hours budget bar: included hours vs consumed | Implemented | index.html, local planning calculators |
| 186 | Revision round counter against the contract limit | Implemented | index.html, local planning calculators |
| 187 | Competing-requests detector | Roadmap | Planned · outside this upgrade |
| 188 | Request queue prioritisation by value and urgency | Implemented | app.py and index.html, session planning |
| 189 | Client request portal where the client submits a request and sees preliminary status | Roadmap | Planned · needs integration or separate local-first design |
| 190 | Negotiation ladder: counteroffers such as reduce scope, defer, or charge | Implemented | index.html, Billable reply formats |
| 191 | Phase-2 parking lot for deferred requests | Implemented | app.py and index.html, session ledger |
| 192 | Request lifecycle (new, quoted, approved, delivered, billed) | Implemented | app.py and index.html, session ledger |
| 193 | Delivered-work proof log | Implemented | app.py and index.html, session ledger |
| 194 | Retroactive audit: scan history for unbilled extras | Implemented | app.py and index.html, session ledger |
| 195 | Dispute pack generator: chronological narrative for resolving disagreements | Implemented | app.py and index.html, session dispute report |
| 196 | Neutral summary of both sides' positions | Implemented | workbench.html and workbench.js, user-entered drafts and estimates |
| 197 | Client communication-style adaptation (direct vs indirect) | Roadmap | Planned · outside this upgrade |
| 198 | Sentiment and urgency detection on incoming messages | Implemented | index.html, English message scan |
| 199 | Escalation detector (refund demands, threats) | Implemented | index.html, English phrase scan with manual speaker selection |
| 200 | Decision-maker check: warn when approval came from someone without authority | Implemented | workbench.html and workbench.js, client coordination |
| 201 | Stakeholder map per client | Implemented | workbench.html and workbench.js, client coordination |
| 202 | Send-time suggestion based on the client's time zone | Implemented | workbench.html and workbench.js, client coordination |
| 203 | Follow-up scheduler when a quote gets no reply | Local equivalent | Follow-up date and in-workbench due alert. Background notification pending. |
| 204 | Scope templates by project type (website, app, design, content) | Implemented | workbench.html and workbench.js |
| 205 | Common scope-creep pattern library per project type | Implemented | workbench.html and workbench.js |
| 206 | Pre-project scope risk checklist | Implemented | workbench.html and workbench.js |
| 207 | Scope definition quality score for the original agreement | Implemented | app.py and index.html · Fictional baseline checklist with HTTP regression. |
| 208 | Suggested "definition of done" for each deliverable | Implemented | workbench.html and workbench.js |
| 209 | Assumptions register | Implemented | app.py and index.html, session planning |
| 210 | Exclusions-first kickoff prompt ("What is NOT included?") | Implemented | workbench.html and workbench.js |
| 211 | Change-cost calculator including context-switching overhead | Implemented | index.html, local planning calculators |
| 212 | Rate card by work type | Implemented | workbench.html and workbench.js, Billing planner |
| 213 | Multiple baselines for clients with several projects | Roadmap | Planned · outside this upgrade |
| 214 | Standing rules engine (for example "bug fixes within 30 days are free") | Roadmap | Planned · outside this upgrade |
| 215 | Bug vs change-request classifier | Implemented | index.html, English message scan |
| 216 | Warranty window tracker | Implemented | index.html, local planning calculators |
| 217 | Support period timers | Implemented | index.html, local planning calculators |
| 218 | Technical feasibility and risk note per request | Implemented | app.py and index.html, session planning |
| 219 | Evaluation harness measuring verdict accuracy against labelled test cases | Implemented | evaluate_verdicts.py, fictional cases |
| 220 | Hindsight memory inspector: view, correct, or delete stored memories | Roadmap | Planned · outside this upgrade |
| 221 | Memory correction workflow when a stored fact is wrong | Roadmap | Planned · outside this upgrade |
| 222 | Scope freeze date after which every change needs an amendment | Roadmap | Planned · outside this upgrade |
| 223 | "Why this line is billable" annotation linking invoice lines to verdicts | Roadmap | Planned · outside this upgrade |
| 224 | Configurable precedence rules (for example later signed amendment overrides earlier chat) | Roadmap | Planned · outside this upgrade |
| 225 | Jargon-free scope summary the client can read | Implemented | app.py and index.html, decision trail summary |
| 226 | Copy-to-clipboard button on every draft | Implemented | index.html |
| 227 | Verdict status in the browser tab title | Implemented | index.html |
| 228 | Toast notifications | Implemented | index.html, session ledger and project history |
| 229 | Recent clients quick switcher | Implemented | workbench.js, five recent tab-local project profiles |
| 230 | Undo last action | Local equivalent | Undo last archive or restore. Other actions pending. |
| 231 | Autosave drafts | Implemented | index.html, tab-local intake and matched assessment reply autosave |
| 232 | Word count and reading time on replies | Implemented | index.html |
| 233 | Date format and locale settings (DD/MM/YYYY) | Implemented | index.html, session ledger and project history |
| 234 | Relative dates ("3 days ago") with exact date on hover | Implemented | index.html, session ledger and project history |
| 235 | Sort and filter the request list | Implemented | index.html · Includes result count and filter/sort reset. |
| 236 | Colour-blind-safe verdict palette | Implemented | index.html |
| 237 | Print-friendly stylesheet | Implemented | index.html |
| 238 | Reduced-motion setting | Implemented | index.html · In-app toggle and system preference. Browser check pending. |
| 239 | Font size control | Implemented | index.html |
| 240 | Quick-example chips under the intake box | Implemented | index.html · Stripe and contact-form examples load into intake for review. Browser check pending. |
| 241 | Copy evidence as citation text | Implemented | index.html |
| 242 | Star/bookmark important requests | Implemented | app.py and index.html, session ledger |
| 243 | Notes field per request | Implemented | app.py and index.html, session ledger |
| 244 | Custom labels/tags on requests | Implemented | app.py and index.html, session ledger |
| 245 | Soft-delete trash with restore | Implemented | Session ledger archive and restore in app.py and index.html |
| 246 | Version label and changelog in the footer | Implemented | index.html |
| 247 | Descriptive loading messages ("Searching memory…") | Implemented | index.html |
| 248 | Helpful suggestions on empty search results | Implemented | index.html · History result count, empty-state guidance and filter reset. |
| 249 | Project wrap-up summary card | Implemented | index.html, session ledger and project history |
| 250 | About page crediting the tech stack (Hindsight, Docker) | Implemented | about.html, /about route and HTTP regression in test_scopekeeper.py. |
