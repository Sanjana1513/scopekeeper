"""Seed and verify fictional ScopeKeeper evidence in separate processes."""
import argparse
import json
import os
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

PROJECT = "scopekeeper-studio-demo"
SOURCES = {
    "agreement-2026-10-03": ("2026-10-03", "The approved website agreement excludes online payments and checkout. Adding a payment gateway is separately billable."),
    "courtesy-2026-10-10": ("2026-10-10", "The freelancer added a WhatsApp contact button for free as a one-time courtesy. This did not change the payment exclusion or create a precedent for other free work."),
    "logo-2026-10-12": ("2026-10-12", "The client chose a navy logo."),
    "meeting-2026-10-14": ("2026-10-14", "The client moved the review meeting to Thursday."),
}
AGREEMENT, COURTESY = tuple(SOURCES)[:2]
PARAPHRASE = "Can customers pay on the site?"
DEMO = "Can you add Razorpay checkout before launch? You did the WhatsApp button for free."


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def post(path, payload):
    base = os.environ.get("HINDSIGHT_URL", "https://api.hindsight.vectorize.io").rstrip("/")
    key = os.environ.get("HINDSIGHT_API_KEY", "").strip()
    host = urlsplit(base)
    local = host.hostname in {"localhost", "127.0.0.1", "::1"}
    if host.scheme != "https" and not (local and host.scheme == "http"):
        raise ValueError("Use HTTPS for remote Hindsight servers.")
    if not key and not local:
        raise ValueError("Set HINDSIGHT_API_KEY in your local terminal.")
    bank = os.environ.get("HINDSIGHT_BANK_ID", PROJECT)
    if not re.fullmatch(r"[a-zA-Z0-9_-]+", bank):
        raise ValueError("Invalid HINDSIGHT_BANK_ID.")
    headers = {"Content-Type": "application/json"}
    if key:
        headers["Authorization"] = f"Bearer {key}"
    request = Request(
        f"{base}/v1/default/banks/{bank}/memories{path}",
        json.dumps(payload).encode(), headers, method="POST",
    )
    with build_opener(NoRedirect()).open(request, timeout=120) as response:
        return json.load(response)


def seed():
    items = [
        {
            "document_id": source_id,
            "timestamp": date + "T12:00:00Z",
            "content": f"Fictional Studio website project, {date}. {content}",
            "metadata": {"project_id": PROJECT},
            "tags": [PROJECT],
        }
        for source_id, (date, content) in SOURCES.items()
    ]
    result = post("", {"items": items, "async": False})
    if result.get("success") is not True:
        raise ValueError("Hindsight did not confirm retain success.")
    print("Retain accepted for:", ", ".join(SOURCES))


def verified_sources(results):
    sources = {}
    for fact in results:
        source_id = fact.get("document_id")
        fact_id = fact.get("id")
        fact_text = fact.get("text")
        if (
            source_id in SOURCES
            and (fact.get("metadata") or {}).get("project_id") == PROJECT
            and PROJECT in (fact.get("tags") or [])
            and isinstance(fact_id, str) and fact_id.strip()
            and isinstance(fact_text, str) and fact_text.strip()
        ):
            sources.setdefault(source_id, {
                "document_id": source_id,
                "fact_id": fact_id,
                "date": SOURCES[source_id][0],
                "recalled_text": fact_text,
            })
    return sources


def verify():
    passed = True
    for query, required in [(PARAPHRASE, {AGREEMENT}), (DEMO, {AGREEMENT, COURTESY})]:
        response = post("/recall", {
            "query": query, "budget": "high", "max_tokens": 2048,
            "types": ["world", "experience"], "tags": [PROJECT], "tags_match": "all",
        })
        evidence = verified_sources(response["results"])
        missing = sorted(required - evidence.keys())
        print(json.dumps({"query": query, "evidence": list(evidence.values()), "missing": missing}, indent=2))
        passed = passed and not missing
    return 0 if passed else 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["seed", "verify"])
    args = parser.parse_args()
    try:
        if args.command == "seed":
            seed()
            return 0
        return verify()
    except HTTPError as error:
        print(f"Hindsight returned HTTP {error.code}.", file=sys.stderr)
    except (URLError, TimeoutError):
        print("Could not reach Hindsight. Check the URL and network.", file=sys.stderr)
    except (ValueError, KeyError, TypeError, AttributeError) as error:
        print(f"Hindsight check failed ({type(error).__name__}).", file=sys.stderr)
        if not os.environ.get("HINDSIGHT_API_KEY") and not os.environ.get("HINDSIGHT_URL"):
            print("Set HINDSIGHT_API_KEY in your local terminal.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
