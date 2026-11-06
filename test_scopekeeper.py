from evidence_integrity import verify_evidence

import csv
import json
from pathlib import Path
import subprocess
import sys
import unittest
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from app import AGREEMENT, AMENDMENT, COURTESY, DEMO, Memory, Project, evidence_from


class Decisions(unittest.TestCase):
    def setUp(self):
        self.project = Project(Memory())

    def test_amendment_proposal_status_does_not_change_scope(self):
        for status in ("Pending", "Declined"):
            self.project.track_amendment("Razorpay", status)
            self.assertEqual(self.project.amendment_status["Razorpay"], status)
            self.assertEqual(self.project.assess(DEMO, True, 2)["verdict"], "Billable")
        with self.assertRaises(ValueError):
            self.project.track_amendment("Razorpay", "Approved")
        self.project.amend(True, "Razorpay")
        self.assertEqual(self.project.amendment_status["Razorpay"], "Approved")
        with self.assertRaises(ValueError):
            self.project.track_amendment("Razorpay", "Declined")
        self.assertEqual(self.project.assess(DEMO, True, 2)["verdict"], "Included")

    def test_history_links_only_the_approved_provider_to_the_amendment(self):
        self.project.amend(True, "Razorpay")
        history = self.project.history()
        agreement = next(item for item in history if item["source"] == AGREEMENT)
        amendment = next(item for item in history if item["source"] == AMENDMENT)
        self.assertIn("Stripe checkout", agreement["scope_items"])
        self.assertEqual(amendment["scope_items"], ["Razorpay checkout"])
        self.assertEqual(amendment["supersedes"], AGREEMENT)
        self.assertIn("Razorpay checkout only", amendment["supersedes_reason"])
        self.assertEqual([item["date"] for item in history], sorted(item["date"] for item in history))

    def test_memory_off_bypasses_recall(self):
        def fail(*args):
            self.fail("Memory OFF called recall")
        self.project.memory.recall = fail
        answer = self.project.assess(DEMO, False, 2)
        self.assertEqual(answer["verdict"], "Needs Review")
        self.assertEqual(answer["evidence"], [])
        self.assertIsNone(answer["estimate"])

    def test_missing_hours_or_rate(self):
        self.assertEqual(self.project.assess(DEMO, True)["estimate"], "Estimate pending")
        self.project.rate = None
        self.assertEqual(self.project.assess(DEMO, True, 2)["estimate"], "Estimate pending")

    def test_known_approval_missing_from_recall(self):
        original = self.project.memory.recall(DEMO, self.project.records)
        self.project.amend(True)
        self.project.memory.recall = lambda *args: original
        answer = self.project.assess(DEMO, True, 2)
        self.assertEqual(answer["verdict"], "Needs Review")
        self.assertIn(AMENDMENT, answer["reason"])

    def test_wrong_project_and_unknown_source(self):
        response = self.project.memory.recall(DEMO, self.project.records)
        for fact in response["results"]:
            fact["metadata"] = {"project_id": "other-project"}
        self.assertEqual(evidence_from(response, self.project.records), {})
        response = self.project.memory.recall(DEMO, self.project.records)
        for fact in response["results"]:
            fact["document_id"] = "unknown"
        self.assertEqual(evidence_from(response, self.project.records), {})

    def test_rejects_forged_chunk(self):
        response = self.project.memory.recall(DEMO, self.project.records)
        for chunk in response["chunks"].values():
            chunk["text"] = "Different approval"
        self.assertEqual(evidence_from(response, self.project.records), {})

    def test_claim_does_not_change_scope(self):
        self.assertEqual(self.project.assess("Client approved Razorpay checkout.", True)["verdict"], "Billable")
        with self.assertRaises(ValueError):
            self.project.amend(False)
        self.assertNotIn(AMENDMENT, self.project.records)

    def test_paraphrase_and_ambiguity(self):
        query = "Can shoppers pay directly on the website?"
        answer = self.project.assess(query, True, 2)
        self.assertEqual(answer["verdict"], "Billable")
        self.assertEqual([item["source"] for item in answer["evidence"]], [AGREEMENT])
        self.project.amend(True)
        answer = self.project.assess(query, True, 2)
        self.assertEqual(answer["verdict"], "Needs Review")
        self.assertIn("Which payment provider", answer["reason"])
        self.assertIsNone(answer["estimate"])

    def test_provider_breakdown(self):
        self.project.amend(True)
        items = self.project.assess("Add Razorpay and Stripe", True, 2)["items"]
        self.assertEqual([(i["item"], i["verdict"]) for i in items],
                         [("Razorpay", "Included"), ("Stripe", "Billable")])
        self.assertEqual(items[1]["estimate"], "Estimate pending")

    def test_missing_source_date_requires_review(self):
        self.project.records[AGREEMENT]["date"] = ""
        verdict = self.project.assess(DEMO, True, 2)
        self.assertEqual(verdict["verdict"], "Needs Review")
        self.assertIn("What date", verdict["reason"])
        self.assertIn(AGREEMENT, verdict["reason"])

    def test_missing_amendment_date_does_not_change_other_provider_verdict(self):
        self.project.amend(True, "Razorpay")
        self.project.records[AMENDMENT]["date"] = "invalid"
        verdict = self.project.assess(DEMO, True, 2)
        self.assertEqual(verdict["verdict"], "Needs Review")
        self.assertIn(AMENDMENT, verdict["reason"])
        self.assertEqual(self.project.assess("Can you add Stripe checkout?", True, 2)["verdict"], "Billable")

    def test_conflicting_amendments_require_review(self):
        self.project.amend(True)
        self.project.records["duplicate"] = dict(self.project.records[AMENDMENT])
        self.assertEqual(self.project.assess(DEMO, True)["verdict"], "Needs Review")
        self.assertEqual(self.project.assess("Stripe checkout", True)["verdict"], "Billable")

    def test_existing_deliverable(self):
        self.assertEqual(self.project.assess("Can you add the contact form?", True)["verdict"], "Included")


class CleanLaunch(unittest.TestCase):
    def test_http_demo_and_reset(self):
        root = Path(__file__).resolve().parent
        self.assertTrue((root / "Start_ScopeKeeper.cmd").is_file())
        self.assertTrue((root / "README.md").is_file())
        with subprocess.Popen([sys.executable, "-u", "app.py", "--simulate", "--no-browser"],
                              cwd=root, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                              text=True) as server:
            try:
                line = server.stdout.readline().strip()
                self.assertTrue(line.startswith("ScopeKeeper ready at "), line)
                url = line.split()[-1]
                with urlopen(url, timeout=5) as page:
                    self.assertIn("Simulated demo", page.read().decode())
                for asset in ("logo.svg", "favicon.svg"):
                    with urlopen(url + asset, timeout=5) as page:
                        self.assertEqual(page.headers.get_content_type(), "image/svg+xml")
                with urlopen(url + "api/config", timeout=5) as response:
                    config = json.load(response)
                self.assertFalse(config["live"])
                self.assertEqual(config["memory_target"], "simulation")

                def post(path, body, authorized=True):
                    headers = {"Content-Type": "application/json"}
                    if authorized:
                        headers["X-ScopeKeeper-Token"] = config["token"]
                    req = Request(url + "api/" + path, json.dumps(body).encode(), headers)
                    with urlopen(req, timeout=5) as response:
                        return json.load(response)

                def assess(memory=True, request=DEMO):
                    return post("assess", dict(request=request, memory=memory, hours=2))

                with self.assertRaises(HTTPError) as forbidden:
                    post("reset", {}, authorized=False)
                self.assertEqual(forbidden.exception.code, 403)
                post("reset", {})
                pinned = post("history/pin", {"source": AGREEMENT, "pinned": True})
                self.assertTrue(next(item for item in pinned if item["source"] == AGREEMENT)["pinned"])
                with urlopen(url + "api/history", timeout=5) as response:
                    agreement = next(item for item in json.load(response) if item["source"] == AGREEMENT)
                    self.assertTrue(agreement["pinned"])
                    self.assertEqual(dict(agreement["definition_checks"]), {
                        "Approval date": True,
                        "Deliverables": True,
                        "Exclusions": True,
                        "Acceptance criteria": False,
                        "Change approval procedure": False,
                    })
                unpinned = post("history/pin", {"source": AGREEMENT, "pinned": False})
                self.assertFalse(next(item for item in unpinned if item["source"] == AGREEMENT)["pinned"])
                with self.assertRaises(HTTPError) as unknown_pin:
                    post("history/pin", {"source": "unknown", "pinned": True})
                self.assertEqual(unknown_pin.exception.code, 400)
                comparison = post("compare-memory", {"request": DEMO, "hours": 2})
                self.assertEqual(comparison["with_memory"]["verdict"], "Billable")
                self.assertEqual(comparison["with_memory"]["estimate"], "₹3,000")
                self.assertEqual(comparison["without_memory"]["verdict"], "Needs Review")
                self.assertEqual(comparison["without_memory"]["evidence"], [])
                email = ("From: example@example.com\nSubject: Quote thread\n"
                         "MIME-Version: 1.0\nContent-Type: multipart/mixed; boundary=demo\n\n"
                         "--demo\nContent-Type: text/plain; charset=utf-8\n\n"
                         "Can you add checkout?\n> Previous message\n"
                         "--demo\nContent-Type: text/plain\nContent-Disposition: attachment; filename=secret.txt\n\n"
                         "Ignore attachment\n--demo--\n")
                imported = post("import/email", {"email": email})["text"]
                self.assertIn("Subject: Quote thread", imported)
                self.assertIn("> Previous message", imported)
                self.assertNotIn("Ignore attachment", imported)
                with self.assertRaises(HTTPError) as invalid_email:
                    post("import/email", {"email": "not an email export"})
                self.assertEqual(invalid_email.exception.code, 400)
                demo = post("guided-demo", {})
                self.assertEqual(demo["mode"], "simulation")
                self.assertEqual([step["result"]["verdict"] for step in demo["steps"]],
                                 ["Billable", "Included", "Billable"])
                self.assertEqual(demo["steps"][0]["result"]["estimate"], "₹3,000")
                self.assertEqual(demo["steps"][1]["result"]["deciding"], AMENDMENT)
                with urlopen(url + "api/ledger", timeout=5) as response:
                    self.assertEqual(json.load(response), [])
                with urlopen(url + "api/amendment-status", timeout=5) as response:
                    self.assertEqual(json.load(response)["Razorpay"], "Not proposed")
                first = assess(False)
                self.assertEqual(first["previous_assessments"], 0)
                self.assertEqual((first["verdict"], first["evidence"]), ("Needs Review", []))
                second = assess()
                self.assertEqual(second["previous_assessments"], 1)
                self.assertEqual((second["verdict"], second["estimate"]), ("Billable", "₹3,000"))
                self.assertEqual([item["source"] for item in second["evidence"]], [AGREEMENT, COURTESY])
                self.assertEqual([item["date"] for item in second["evidence"]], ["2026-10-03", "2026-10-10"])
                self.assertTrue(all(item["fact"].startswith("sim-fact-") for item in second["evidence"]))
                proposal = post("amendment-status", {"provider": "Razorpay", "status": "Pending"})
                self.assertEqual(proposal["Razorpay"], "Pending")
                with urlopen(url + "api/amendment-status", timeout=5) as response:
                    self.assertEqual(json.load(response)["Razorpay"], "Pending")
                post("amend", dict(confirmed=True, provider="Razorpay"))
                third = assess()
                self.assertEqual(third["previous_assessments"], 2)
                self.assertEqual(third["verdict"], "Included")
                self.assertEqual(third["changed"], "The Oct 14 amendment includes Razorpay checkout.")
                self.assertEqual([item["source"] for item in third["evidence"]], [AMENDMENT])
                self.assertIsNone(third["estimate"])
                self.assertEqual(second["deciding"], AGREEMENT)
                self.assertEqual(third["deciding"], AMENDMENT)
                self.assertEqual(third["evidence"][0]["date"], "2026-10-14")
                stripe = assess(request="Can you add Stripe checkout?")
                self.assertEqual(stripe["previous_assessments"], 0)
                self.assertEqual(stripe["deciding"], AGREEMENT)
                for answer in (second, third, stripe):
                    self.assertTrue(answer["reply"])
                    self.assertTrue(answer["evidence"][0]["date"])
                with urlopen(url + "welcome", timeout=5) as response:
                    self.assertEqual(response.headers.get_content_type(), "text/html")
                    page = response.read()
                    for label in (b"ScopeKeeper in 60 seconds", b"Razorpay", b"Stripe", b"Open scope review"):
                        self.assertIn(label, page)
                with urlopen(url + "about", timeout=5) as response:
                    self.assertEqual(response.headers.get_content_type(), "text/html")
                    page = response.read()
                    for credit in (b"About ScopeKeeper", b"Hindsight", b"Docker"):
                        self.assertIn(credit, page)
                with urlopen(url + "workbench", timeout=5) as response:
                    self.assertIn(b"Project workbench", response.read())
                with urlopen(url + "workbench.js", timeout=5) as response:
                    self.assertIn(b"function contractChecks", response.read())
                with urlopen(url + "api/ledger", timeout=5) as response:
                    ledger = json.load(response)
                self.assertEqual(len(ledger), 4)
                self.assertFalse(ledger[0]["memory_enabled"])
                self.assertEqual(ledger[1]["assessed_hours"], "2")
                self.assertEqual(ledger[0]["trail"][0]["evidence"], [])
                self.assertEqual(ledger[1]["memory_mode"], "simulation")
                self.assertTrue(ledger[1]["assessed_at"].endswith("+00:00"))
                self.assertEqual(ledger[1]["trail"][0]["deciding"], AGREEMENT)
                self.assertEqual(ledger[2]["trail"][0]["deciding"], AMENDMENT)
                self.assertEqual(ledger[1]["request"], ledger[2]["request"])
                bundle = post("ledger/evidence", {"id": ledger[1]["id"]})
                self.assertTrue(verify_evidence(bundle))
                self.assertTrue(verify_evidence(bundle, bundle["sha256"]))
                self.assertFalse(verify_evidence(bundle | {"request": "Edited after export"}))
                self.assertFalse(verify_evidence(bundle, "0" * 64))
                self.assertEqual(bundle["schema_version"], 1)
                self.assertEqual(bundle["request"], DEMO)
                self.assertEqual([attempt["trail"][0]["deciding"] for attempt in bundle["assessments"]],
                                 [None, AGREEMENT, AMENDMENT])
                self.assertEqual(set(bundle["assessments"][1]),
                                 {"assessed_at", "memory_enabled", "memory_mode", "trail", "overrides"})
                with self.assertRaises(HTTPError) as missing:
                    post("ledger/evidence", {"id": "not-in-session"})
                self.assertEqual(missing.exception.code, 404)
                report = post("ledger/dispute", {"id": ledger[1]["id"]})["report"]
                self.assertIn(DEMO, report)
                self.assertLess(report.index("Memory: off"), report.index("Memory: simulation"))
                self.assertLess(report.index(AGREEMENT), report.index(AMENDMENT))
                self.assertIn("Estimate: ₹3,000", report)
                self.assertNotIn("Can you add Stripe checkout?", report)
                decision = dict(id=ledger[1]["id"], item=0, verdict="Courtesy", reason="One-time exception")
                override = post("ledger/override", decision)
                self.assertEqual(override["overrides"][0]["verdict"], "Courtesy")
                self.assertEqual(override["trail"][0]["verdict"], "Billable")
                updated_report = post("ledger/dispute", {"id": ledger[1]["id"]})["report"]
                self.assertIn("Courtesy. One-time exception", updated_report)
                with self.assertRaises(HTTPError) as invalid_override:
                    post("ledger/override", decision | {"reason": ""})
                self.assertEqual(invalid_override.exception.code, 400)
                billable_summary = post("ledger/summary", {"id": ledger[1]["id"]})["summary"]
                self.assertIn("extra work", billable_summary)
                self.assertIn("2026-10-03", billable_summary)
                self.assertIn("₹3,000", billable_summary)
                self.assertNotIn(AGREEMENT, billable_summary)
                included_summary = post("ledger/summary", {"id": ledger[2]["id"]})["summary"]
                self.assertIn("approved scope covers", included_summary)
                self.assertIn("2026-10-14", included_summary)
                self.assertNotIn("₹", included_summary)
                details = dict(id=ledger[1]["id"], starred=True, notes="Review quote", tags=["Checkout", "Checkout"])
                saved = post("ledger/annotate", details)
                self.assertEqual((saved["starred"], saved["notes"], saved["tags"]),
                                 (True, "Review quote", ["Checkout"]))
                with self.assertRaises(HTTPError) as invalid:
                    post("ledger/annotate", details | {"notes": "x" * 501})
                self.assertEqual(invalid.exception.code, 400)
                with urlopen(url + "api/ledger", timeout=5) as response:
                    self.assertEqual(json.load(response)[1]["notes"], "Review quote")
                self.assertEqual(stripe["verdict"], "Billable")
                with urlopen(url + "api/ledger.csv", timeout=5) as response:
                    rows = list(csv.DictReader(response.read().decode("utf-8-sig").splitlines()))
                self.assertEqual([row["deciding_source_id"] for row in rows],
                                 ["", AGREEMENT, AMENDMENT, AGREEMENT])
                self.assertEqual(rows[2]["deciding_fact_id"], "sim-fact-" + AMENDMENT)
                self.assertEqual([row["verdict"] for row in rows],
                                 ["Needs Review", "Billable", "Included", "Billable"])
                plan = dict(id=details["id"], value=3, urgency=2, risk="Review checkout API",
                            assumptions=["Client supplies access", " Client supplies access "])
                planned = post("ledger/plan", plan)
                self.assertEqual(planned["planning"], dict(value=3, urgency=2, risk="Review checkout API",
                                 assumptions=["Client supplies access"]))
                self.assertEqual(planned["verdicts"], ["Billable"])
                with self.assertRaises(HTTPError) as invalid_plan:
                    post("ledger/plan", plan | {"value": 4})
                self.assertEqual(invalid_plan.exception.code, 400)
                progress = post("ledger/progress", {"id": details["id"], "stage": "Delivered", "proof": "Delivery reference"})
                self.assertEqual(progress["stage"], "Delivered")
                self.assertEqual(progress["proof"][0]["text"], "Delivery reference")
                self.assertEqual(progress["verdicts"], ["Billable"])
                with self.assertRaises(HTTPError) as invalid_stage:
                    post("ledger/progress", {"id": details["id"], "stage": "Deferred", "proof": "Invalid"})
                self.assertEqual(invalid_stage.exception.code, 400)
                archived = post("ledger/archive", {"id": details["id"], "archived": True})
                self.assertTrue(archived["archived"])
                with urlopen(url + "api/ledger.csv", timeout=5) as response:
                    archived_rows = list(csv.DictReader(response.read().decode("utf-8-sig").splitlines()))
                self.assertEqual(archived_rows, [rows[0], *rows[2:]])
                restored = post("ledger/archive", {"id": details["id"], "archived": False})
                self.assertFalse(restored["archived"])
                self.assertEqual(restored["notes"], "Review quote")
                self.assertEqual(restored["planning"], planned["planning"])
                with urlopen(url + "api/ledger.csv", timeout=5) as response:
                    self.assertEqual(list(csv.DictReader(response.read().decode("utf-8-sig").splitlines())), rows)
                post("reset", {})
                with urlopen(url + "api/ledger.csv", timeout=5) as response:
                    self.assertEqual(len(response.read().decode("utf-8-sig").splitlines()), 1)
                with self.assertRaises(HTTPError) as stale:
                    post("ledger/annotate", details)
                self.assertEqual(stale.exception.code, 404)
                self.assertEqual(assess(), {**second, "previous_assessments": 0})
            finally:
                server.terminate()
                server.wait(timeout=5)


if __name__ == "__main__":
    unittest.main()
