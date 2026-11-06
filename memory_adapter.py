import re
import hindsight_check as hindsight

PROJECT = hindsight.PROJECT
AGREEMENT, COURTESY = hindsight.AGREEMENT, hindsight.COURTESY
AMENDMENT = "amendment-2026-10-14-razorpay"
DEMO = hindsight.DEMO
PAYMENTS = re.compile(r'\b(payments?|pay|checkout|payment gateway)\b', re.I)
PROVIDERS = ("Razorpay", "Stripe")


class Memory:
    def __init__(self, live=False):
        self.live = live

    def retain(self, records):
        if not self.live:
            return
        items = [
            dict(document_id=source, timestamp=record["date"] + "T12:00:00Z",
                 content=record["text"], tags=[PROJECT], metadata={"project_id": PROJECT})
            for source, record in records.items()
        ]
        result = hindsight.post("", {"items": items, "async": False})
        if result.get("success") is not True:
            raise ValueError("Hindsight did not confirm retain.")

    def recall(self, query, records):
        if self.live:
            return hindsight.post("/recall", dict(
                query=query, types=["world", "experience"], budget="high",
                max_tokens=2048, tags=[PROJECT], tags_match="all",
                include={"chunks": {"max_tokens": 8192}},
            ))
        results, chunks = [], {}
        for source, record in records.items():
            relevant = (
                source == AGREEMENT and bool(PAYMENTS.search(query) or
                    re.search(r"razorpay|stripe|website|contact form", query, re.I))
                or source == COURTESY and "whatsapp" in query.lower()
                or record.get("term", "").lower() in query.lower()
                and bool(record.get("term"))
            )
            if relevant:
                chunk_id = "sim-chunk-" + source
                chunks[chunk_id] = {"id": chunk_id, "text": record["text"]}
                results.append(dict(document_id=source, id="sim-fact-" + source,
                    chunk_id=chunk_id, text=record["text"], tags=[PROJECT],
                    metadata={"project_id": PROJECT}))
        return {"results": results, "chunks": chunks}


