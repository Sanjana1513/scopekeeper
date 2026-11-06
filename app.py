"""Local, fictional scope-review prototype."""
import argparse
import csv
from io import StringIO
from evidence_integrity import evidence_digest
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from email import policy
from email.parser import Parser
from functools import partial
from getpass import getpass
from http.server import BaseHTTPRequestHandler, HTTPServer
import json
import os
from pathlib import Path
import re
import secrets
import threading
from urllib.parse import urlsplit
import webbrowser

import hindsight_check as hindsight

ROOT = Path(__file__).resolve().parent
from memory_adapter import AGREEMENT, AMENDMENT, COURTESY, DEMO, Memory, PAYMENTS, PROJECT, PROVIDERS

def money(value):
    return f"₹{value:,.2f}".removesuffix(".00")


def positive(value):
    try:
        number = Decimal(str(value))
        if number.is_finite() and 0 < number <= 1_000_000:
            return number
    except InvalidOperation:
        pass
    return None


def evidence_from(response, records, undated=None):
    evidence = {}
    for fact in response.get("results", []):
        source = fact.get("document_id")
        if source not in records or PROJECT not in (fact.get("tags") or []):
            continue
        if (fact.get("metadata") or {}).get("project_id") != PROJECT:
            continue
        fact_id = fact.get("id")
        chunk_id = fact.get("chunk_id")
        chunk = (response.get("chunks") or {}).get(chunk_id) or {}
        record = records[source]
        if (not isinstance(fact_id, str) or not fact_id.strip() or not chunk_id
            or chunk.get("id") != chunk_id or chunk.get("truncated")
            or chunk.get("text", "").strip() != record["text"]):
            continue
        try:
            date.fromisoformat(record["date"])
        except (ValueError, KeyError, TypeError):
            if undated is not None:
                undated.add(source)
            continue
        evidence[source] = {"source": source, "fact": fact_id,
                            "date": record["date"], "text": chunk["text"]}
    return evidence


def result(verdict, reason, evidence=(), estimate=None, changed=""):
    evidence = list(evidence)
    if verdict in {"Included", "Courtesy", "Billable"} and not evidence:
        verdict, reason, estimate, changed = "Needs Review", "Provide a verified dated source.", None, ""
    deciding = evidence[0]["source"] if evidence and verdict != "Needs Review" else None
    replies = {
        "Courtesy": "The dated record describes this as a one-time courtesy.",
        "Needs Review": reason,
        "Billable": "Thanks for the request. This is outside the approved website scope. "
                    + (f"My estimate is {estimate}. " if estimate and estimate != "Estimate pending"
                       else "I can confirm the estimate once the rate and hours are available. ")
                    + "Please confirm before I start the extra work.",
        "Included": "Thanks for the request. This is included in the recorded project scope. "
                    "I’ll confirm the delivery timing separately.",
    }
    return dict(verdict=verdict, reason=reason, evidence=list(evidence),
                estimate=estimate, changed=changed, reply=replies[verdict], deciding=deciding)


class Project:
    def __init__(self, memory):
        self.memory = memory
        self.reset()

    def reset(self):
        seed = json.loads((ROOT / "demo.json").read_text(encoding="utf-8"))
        if self.memory.live:
            previous_bank = os.environ.get("HINDSIGHT_BANK_ID")
            os.environ["HINDSIGHT_BANK_ID"] = "scopekeeper-" + secrets.token_hex(8)
            try:
                self.memory.retain(seed["records"])
            except Exception:
                if previous_bank:
                    os.environ["HINDSIGHT_BANK_ID"] = previous_bank
                else:
                    os.environ.pop("HINDSIGHT_BANK_ID", None)
                raise
        self.records = seed["records"]
        self.rate = seed["rate"]
        self.baseline = tuple(seed["records"][AGREEMENT].items())
        self.ledger = []
        self.pinned_sources = set()
        self.amendment_status = {provider: "Not proposed" for provider in PROVIDERS}

    def track_amendment(self, provider, status):
        if provider not in PROVIDERS or status not in ("Pending", "Declined"):
            raise ValueError("Choose a provider and a pending or declined status.")
        if self.amendment_status[provider] == "Approved":
            raise ValueError("Recorded approval cannot be changed through proposal tracking.")
        self.amendment_status[provider] = status

    def amend(self, confirmed, provider="Razorpay"):
        if confirmed is not True or provider not in PROVIDERS:
            raise ValueError("Confirm client approval and select a supported provider.")
        source = AMENDMENT if provider == "Razorpay" else "amendment-2026-10-14-stripe"
        record = dict(date="2026-10-14", term=provider,
                      text=f"Client-approved amendment dated October 14, 2026. "
                           f"{provider} checkout is included. All other agreement terms remain in force.")
        # Register approval first so a failed retain cannot restore an older verdict.
        self.records[source] = record
        self.amendment_status[provider] = "Approved"
        self.memory.retain({source: record})

    def history(self):
        topics = {
            AGREEMENT: ["Website and contact form", "Razorpay checkout", "Stripe checkout"],
            COURTESY: ["WhatsApp contact button"],
        }
        history = []
        for source, record in self.records.items():
            provider = record.get("term")
            item = {"source": source, "pinned": source in self.pinned_sources, **record}
            if provider in PROVIDERS:
                item.update(scope_items=[provider + " checkout"], supersedes=AGREEMENT,
                            supersedes_reason=f"The approved amendment replaces the payment exclusion for {provider} checkout only.")
            else:
                item["scope_items"] = topics.get(source, ["Other project records"])
            if source == AGREEMENT:
                item["definition_checks"] = [
                    ["Approval date", bool(record.get("date"))],
                    ["Deliverables", "five-page website with a contact form" in record["text"]],
                    ["Exclusions", "Online payments and checkout are excluded" in record["text"]],
                    ["Acceptance criteria", "acceptance criteria" in record["text"].lower()],
                    ["Change approval procedure", "change approval procedure" in record["text"].lower()],
                ]
            history.append(item)
        return sorted(history, key=lambda item: (item["date"], item["source"]))

    @staticmethod
    def date_needed(source):
        return result("Needs Review", f"What date appears on the original record ({source})? A verified date is needed before this record can decide scope.")

    def assess(self, query, memory, hours=None):
        if memory is not True:
            return result("Needs Review", "Can you share the approved scope for this request?")
        try:
            undated = set()
            evidence = evidence_from(self.memory.recall(query, self.records), self.records, undated)
        except Exception:
            return result("Needs Review", "Could you verify the governing project evidence? Recall is unavailable.")
        providers = [name for name in PROVIDERS if re.search(rf"\b{name}\b", query, re.I)]
        is_payment = bool(providers or PAYMENTS.search(query))
        if len(providers) > 1:
            return dict(items=[self.payment([provider], query, None, evidence, undated) |
                               {"item": provider} for provider in providers])
        if is_payment:
            return self.payment(providers, query, hours, evidence, undated)
        if re.search(r"\b(contact form|five[- ]page website)\b", query, re.I):
            if AGREEMENT in evidence:
                return result("Included", "The original agreement covers this work.", [evidence[AGREEMENT]])
            if AGREEMENT in undated:
                return self.date_needed(AGREEMENT)
        if "whatsapp" in query.lower() and COURTESY in evidence:
            return result("Needs Review", "Do you mean the existing courtesy button or additional WhatsApp work?",
                          [evidence[COURTESY]])
        return result("Needs Review", "Which approved website deliverable does this request relate to?")

    def payment(self, providers, query, hours, evidence, undated):
        amendments = {}
        for source, record in self.records.items():
            term = record.get("term")
            if term is None:
                continue
            if term in amendments and (not providers or term == providers[0]):
                return result("Needs Review", f"Confirm which dated {term} amendment governs.")
            amendments[term] = source
        if not providers and amendments:
            related = [evidence[source] for source in [AGREEMENT, *amendments.values()] if source in evidence]
            return result("Needs Review", "Which payment provider do you mean, such as Razorpay or Stripe?", related)
        if providers and providers[0] in amendments:
            provider = providers[0]
            source = amendments[provider]
            if source in undated:
                return self.date_needed(source)
            if source not in evidence:
                return result("Needs Review", f"Please verify the approved {provider} amendment ({source}).")
            change = f"The Oct 14 amendment includes {provider} checkout."
            return result("Included", change, [evidence[source]], changed=change)
        if AGREEMENT in undated:
            return self.date_needed(AGREEMENT)
        if AGREEMENT not in evidence:
            return result("Needs Review", "Can you verify the original agreement's payment terms?")
        cited = [evidence[AGREEMENT]]
        if "whatsapp" in query.lower() and COURTESY in evidence:
            cited.append(evidence[COURTESY])
        rate, duration = positive(self.rate), positive(hours)
        estimate = money(rate * duration) if rate and duration else "Estimate pending"
        return result("Billable", "The Oct 3 agreement excludes online payments.", cited, estimate)


def client_summary(item):
    """Summarize a captured assessment without internal fact identifiers."""
    verdict = item["verdict"]
    lines = {
        "Included": "The approved scope covers this request.",
        "Billable": "This request is outside the approved scope and would be extra work.",
        "Needs Review": "More information is needed before we can confirm the scope.",
    }
    summary = lines.get(verdict, verdict)
    source = next((source for source in item["evidence"] if source["source"] == item["deciding"]), None)
    if source:
        summary += f" This is based on the project record dated {source['date']}."
    if item["estimate"]:
        summary += (" We still need the rate and hours to confirm an estimate."
                    if item["estimate"] == "Estimate pending" else f" Estimated cost: {item['estimate']}.")
    return summary


def email_thread_text(raw):
    if not isinstance(raw, str) or not raw.strip():
        raise ValueError("Choose a non-empty email export.")
    message = Parser(policy=policy.default).parsestr(raw)
    if not any(message[name] for name in ("Subject", "From", "Date", "MIME-Version")):
        raise ValueError("Choose an .eml export with email headers.")
    sections = []
    for part in message.walk():
        if part.get_content_type() == "text/plain" and part.get_content_disposition() != "attachment":
            content = part.get_content().strip()
            if content:
                sections.append(content)
    if not sections:
        raise ValueError("This email has no readable plain-text body. Paste the relevant excerpt instead.")
    subject = str(message.get("Subject", "")).strip()
    return (("Subject: " + subject + "\n\n") if subject else "") + "\n\n".join(sections)


def guided_demo():
    project = Project(Memory())
    before = project.assess(DEMO, True, 2)
    project.amend(True, "Razorpay")
    after = project.assess(DEMO, True, 2)
    stripe_request = "Can you add Stripe checkout?"
    stripe = project.assess(stripe_request, True, 2)
    return [
        {"title": "Assess the original request", "request": DEMO, "result": before},
        {"title": "Recheck after a client-approved amendment", "request": DEMO, "result": after},
        {"title": "Check the other checkout provider", "request": stripe_request, "result": stripe},
    ]


class Handler(BaseHTTPRequestHandler):
    def __init__(self, *args, project, token, **kwargs):
        self.project, self.token = project, token
        super().__init__(*args, **kwargs)

    def send(self, data, content_type="application/json", status=200):
        if content_type == "application/json":
            data = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.headers.get("Host") != f"127.0.0.1:{self.server.server_port}":
            return self.send({"error": "Use the local app URL."}, status=403)
        assets = {"/workbench": ("workbench.html", "text/html; charset=utf-8"),
                  "/workbench.js": ("workbench.js", "text/javascript; charset=utf-8"),
                  "/welcome": ("welcome.html", "text/html; charset=utf-8"),
                  "/about": ("about.html", "text/html; charset=utf-8"),
                  "/": ("index.html", "text/html; charset=utf-8"),
                  "/logo.svg": ("logo.svg", "image/svg+xml"),
                  "/favicon.svg": ("favicon.svg", "image/svg+xml"),
                  "/roadmap": ("ROADMAP.md", "text/plain; charset=utf-8")}
        if self.path in assets:
            name, content_type = assets[self.path]
            return self.send((ROOT / name).read_bytes(), content_type)
        if self.path == "/api/amendment-status":
            return self.send(self.project.amendment_status)
        if self.path == "/api/ledger":
            return self.send(self.project.ledger)
        if self.path == "/api/ledger.csv":
            output = StringIO(newline="")
            writer = csv.writer(output)
            writer.writerow(["date", "item", "verdict", "deciding_source_id", "deciding_fact_id"])
            for entry in self.project.ledger:
                if entry["archived"]:
                    continue
                for outcome in entry["outcomes"]:
                    writer.writerow([entry["date"], *outcome])
            return self.send(output.getvalue().encode("utf-8-sig"), "text/csv; charset=utf-8")
        if self.path == "/api/history":
            return self.send(self.project.history())
        if self.path == "/api/config":
            live = self.project.memory.live
            target = "simulation"
            if live:
                endpoint = os.environ.get("HINDSIGHT_URL", "")
                hostname = urlsplit(endpoint).hostname
                target = "local" if hostname in ("localhost", "127.0.0.1", "::1") else "remote"
            return self.send({"token": self.token, "live": live, "memory_target": target, "request": DEMO})
        return self.send({"error": "Unknown path."}, status=404)

    def do_POST(self):
        if (self.headers.get("Host") != f"127.0.0.1:{self.server.server_port}"
            or self.headers.get("X-ScopeKeeper-Token") != self.token):
            return self.send({"error": "Open the local app to continue."}, status=403)
        try:
            size = int(self.headers.get("Content-Length", 0))
            if not 0 < size <= 24000:
                raise ValueError("Request is empty or too large.")
            body = json.loads(self.rfile.read(size))
            if self.path == "/api/guided-demo":
                return self.send({"mode": "simulation", "steps": guided_demo()})
            if self.path == "/api/import/email":
                try:
                    return self.send({"text": email_thread_text(body.get("email"))})
                except (ValueError, LookupError) as error:
                    return self.send({"error": str(error)}, status=400)
            if self.path in {"/api/assess", "/api/compare-memory"}:
                query = body["request"].strip()
                if not query or len(query) > 4000:
                    raise ValueError("Enter a request of 1–4000 characters.")
                if self.path == "/api/compare-memory":
                    return self.send({
                        "with_memory": self.project.assess(query, True, body.get("hours")),
                        "without_memory": self.project.assess(query, False, body.get("hours")),
                    })
                decision = self.project.assess(query, body.get("memory"), body.get("hours"))
                items = decision.get("items", [decision])
                outcomes = []
                for item in items:
                    source = item["deciding"]
                    fact = next((entry["fact"] for entry in item["evidence"] if entry["source"] == source), "")
                    # Guard external IDs against spreadsheet formula interpretation.
                    if fact.lstrip().startswith(("=", "+", "-", "@")) or fact.startswith(("\t", "\r", "\n")):
                        fact = "'" + fact
                    outcomes.append([item.get("item", ""), item["verdict"], source or "", fact])
                verdicts = [item["verdict"] for item in items]
                trail = [{"item": item.get("item", ""), "verdict": item["verdict"],
                          "reason": item["reason"], "deciding": item["deciding"],
                          "evidence": item["evidence"], "estimate": item["estimate"]}
                         for item in items]
                assessed_hours = positive(body.get("hours"))
                normalized_request = " ".join(query.casefold().split())
                decision["previous_assessments"] = sum(
                    " ".join(row["request"].casefold().split()) == normalized_request
                    for row in self.project.ledger if not row["archived"]
                )
                self.project.ledger.append({"assessed_hours": str(assessed_hours) if assessed_hours is not None else None,
                                            "assessed_at": datetime.now(timezone.utc).isoformat(),
                                            "memory_enabled": body.get("memory") is True,
                                            "memory_mode": "live" if self.project.memory.live else "simulation",
                                            "trail": trail, "overrides": [],
                                            "date": date.today().isoformat(), "request": query,
                                            "verdicts": verdicts, "outcomes": outcomes,
                                            "id": secrets.token_hex(12), "starred": False,
                                            "notes": "", "tags": [], "archived": False,
                                            "stage": "New", "proof": [],
                                            "planning": {"value": 0, "urgency": 0, "risk": "", "assumptions": []}})
                return self.send(decision)
            if self.path in {"/api/ledger/annotate", "/api/ledger/archive", "/api/ledger/progress", "/api/ledger/plan", "/api/ledger/evidence", "/api/ledger/dispute", "/api/ledger/summary", "/api/ledger/override"}:
                entry = next((row for row in self.project.ledger if row["id"] == body.get("id")), None)
                if entry is None:
                    return self.send({"error": "This request is no longer in the session."}, status=404)
                if self.path == "/api/ledger/override":
                    index, verdict, reason = body.get("item"), body.get("verdict"), body.get("reason")
                    if (entry["archived"] or type(index) is not int or not 0 <= index < len(entry["trail"])
                        or verdict not in ("Included", "Billable", "Courtesy", "Needs Review")
                        or not isinstance(reason, str) or not 1 <= len(reason.strip()) <= 500):
                        return self.send({"error": "Select a valid verdict and enter a reason of up to 500 characters."}, status=400)
                    if len(entry["overrides"]) >= 50:
                        return self.send({"error": "This assessment already has 50 manual decisions."}, status=400)
                    entry["overrides"].append({"item": index, "verdict": verdict, "reason": reason.strip(),
                                               "recorded_at": datetime.now(timezone.utc).isoformat()})
                    return self.send(entry)
                if self.path == "/api/ledger/summary":
                    return self.send({"summary": "\n".join(
                        (item["item"] + ": " if item["item"] else "") + client_summary(item)
                        for item in entry["trail"]
                    )})
                if self.path in {"/api/ledger/evidence", "/api/ledger/dispute"}:
                    versions = [
                        {key: row[key] for key in ("assessed_at", "memory_enabled", "memory_mode", "trail", "overrides")}
                        for row in self.project.ledger if row["request"] == entry["request"]
                    ]
                    if self.path == "/api/ledger/dispute":
                        lines = ["ScopeKeeper dispute report", "", "Request", entry["request"],
                                 "", "Assessment timeline (UTC)"]
                        for number, version in enumerate(versions, 1):
                            mode = version["memory_mode"] if version["memory_enabled"] else "off"
                            lines.extend(["", f"{number}. {version['assessed_at']} | Memory: {mode}"])
                            for item in version["trail"]:
                                label = item["item"] or "Request"
                                lines.append(f"   {label}: {item['verdict']}. {item['reason']}")
                                if item["estimate"]:
                                    lines.append(f"   Estimate: {item['estimate']}")
                                for source in item["evidence"]:
                                    role = "Deciding source" if source["source"] == item["deciding"] else "Context"
                                    lines.append(f"   {role}: {source['date']} | {source['source']} | Fact: {source['fact']}")
                                    lines.append(f"   {source['text']}")
                            for override in version["overrides"]:
                                original = version["trail"][override["item"]]
                                label = original["item"] or "Request"
                                lines.append(f"   Manual decision for {label} ({override['recorded_at']}): "
                                             f"{override['verdict']}. {override['reason']}")
                        return self.send({"report": "\n".join(lines) + "\n"})
                    bundle = {"schema_version": 1, "request": entry["request"], "assessments": versions}
                    bundle["sha256"] = evidence_digest(bundle)
                    return self.send(bundle)
                if self.path == "/api/ledger/archive":
                    archived = body.get("archived")
                    if not isinstance(archived, bool):
                        return self.send({"error": "Choose archive or restore."}, status=400)
                    entry["archived"] = archived
                    return self.send(entry)
                if self.path == "/api/ledger/progress":
                    stage, proof = body.get("stage"), body.get("proof", "")
                    if (entry["archived"] or stage not in ("New", "Quoted", "Approved", "Delivered", "Billed", "Deferred")
                        or not isinstance(proof, str) or len(proof) > 500
                        or (proof.strip() and stage not in ("Delivered", "Billed"))):
                        return self.send({"error": "Choose a valid stage. Add proof only for delivered or billed work."}, status=400)
                    entry["stage"] = stage
                    if proof.strip():
                        entry["proof"].append({"date": date.today().isoformat(), "text": proof.strip()})
                    return self.send(entry)
                if self.path == "/api/ledger/plan":
                    value, urgency = body.get("value"), body.get("urgency")
                    risk, assumptions = body.get("risk"), body.get("assumptions")
                    if (entry["archived"] or type(value) is not int or not 0 <= value <= 3
                        or type(urgency) is not int or not 0 <= urgency <= 3
                        or not isinstance(risk, str) or len(risk) > 500
                        or not isinstance(assumptions, list) or len(assumptions) > 10
                        or any(not isinstance(line, str) or not 1 <= len(line.strip()) <= 200 for line in assumptions)):
                        return self.send({"error": "Use ratings from 0 to 3, up to 500 risk characters and at most ten assumptions of up to 200 characters."}, status=400)
                    entry["planning"] = {"value": value, "urgency": urgency, "risk": risk.strip(),
                                         "assumptions": list(dict.fromkeys(line.strip() for line in assumptions))}
                    return self.send(entry)
                notes = body.get("notes")
                tags = body.get("tags")
                starred = body.get("starred")
                if (not isinstance(notes, str) or len(notes) > 500
                    or not isinstance(tags, list) or len(tags) > 8
                    or any(not isinstance(tag, str) or not 1 <= len(tag.strip()) <= 24 for tag in tags)
                    or not isinstance(starred, bool)):
                    return self.send({"error": "Use at most 500 note characters and eight tags of up to 24 characters."}, status=400)
                entry.update(notes=notes.strip(), tags=list(dict.fromkeys(tag.strip() for tag in tags)), starred=starred)
                return self.send(entry)
            if self.path == "/api/history/pin":
                source, pinned = body.get("source"), body.get("pinned")
                if not isinstance(source, str) or source not in self.project.records or not isinstance(pinned, bool):
                    return self.send({"error": "Choose an existing project record."}, status=400)
                if pinned:
                    self.project.pinned_sources.add(source)
                else:
                    self.project.pinned_sources.discard(source)
                return self.send(self.project.history())
            if self.path == "/api/amendment-status":
                try:
                    self.project.track_amendment(body.get("provider"), body.get("status"))
                except ValueError as error:
                    return self.send({"error": str(error)}, status=400)
                return self.send(self.project.amendment_status)
            if self.path == "/api/amend":
                self.project.amend(body.get("confirmed"), body.get("provider"))
            elif self.path == "/api/reset":
                self.project.reset()
            else:
                return self.send({"error": "Unknown path."}, status=404)
            return self.send({"ok": True})
        except (ValueError, KeyError, TypeError, AttributeError):
            return self.send({"error": "Check the request fields and confirm client approval."}, status=400)
        except Exception:
            return self.send({"error": "Hindsight is unavailable. Check the connection and retry."}, status=502)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--simulate", action="store_true")
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument("--port", type=int, default=0)
    args = parser.parse_args()
    live = False
    if not args.simulate:
        if not os.environ.get("HINDSIGHT_API_KEY"):
            key = getpass("Hindsight Cloud API key (hidden, or press Enter for simulation): ").strip()
            if key:
                os.environ["HINDSIGHT_API_KEY"] = key
        live = bool(os.environ.get("HINDSIGHT_API_KEY"))
    try:
        project = Project(Memory(live))
    except Exception:
        print("Live setup could not retain the demo records. Starting labeled simulation.", flush=True)
        project = Project(Memory())
    handler = partial(Handler, project=project, token=secrets.token_urlsafe(32))
    with HTTPServer(("127.0.0.1", args.port), handler) as server:
        url = f"http://127.0.0.1:{server.server_port}/"
        print(f"ScopeKeeper ready at {url}", flush=True)
        if not args.no_browser:
            threading.Thread(target=webbrowser.open, args=(url,), daemon=True).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
