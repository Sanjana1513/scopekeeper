"""Evaluate verdicts and deciding sources on labelled fictional requests."""
from app import AGREEMENT, AMENDMENT, DEMO, Memory, Project


def main():
    cases = [
        ("Original Razorpay request", DEMO, True, False, "Billable", AGREEMENT),
        ("Approved Razorpay change", DEMO, True, True, "Included", AMENDMENT),
        ("Stripe after Razorpay approval", "Can you add Stripe checkout?", True, True, "Billable", AGREEMENT),
        ("Memory disabled", DEMO, False, False, "Needs Review", None),
        ("Unclear request", "Can you improve this?", True, False, "Needs Review", None),
        ("Baseline contact form", "Can you add the contact form?", True, False, "Included", AGREEMENT),
    ]
    correct = 0
    for label, query, memory, amended, verdict, source in cases:
        project = Project(Memory())
        if amended:
            project.amend(True, provider="Razorpay")
        answer = project.assess(query, memory, 2)
        passed = (answer["verdict"], answer["deciding"]) == (verdict, source)
        correct += passed
        print(f"{'PASS' if passed else 'FAIL'} {label}: {answer['verdict']} | {answer['deciding']}")
    print(f"Fixture accuracy (verdict and source): {correct}/{len(cases)}")
    return int(correct != len(cases))


if __name__ == "__main__":
    raise SystemExit(main())
