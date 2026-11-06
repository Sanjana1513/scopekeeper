# ScopeKeeper submission kit

## Demo script · approximately 3 minutes

**0:00–0:25.** “A freelancer is about to launch a five-page website. The client asks for Razorpay and mentions a free WhatsApp button. ScopeKeeper checks the project history and prepares a reply.” Show the mode badge and say “This recording uses simulated retrieval” if the badge says so.

**0:25–0:55.** Reset and start a New Chat. Enter “Can you add Razorpay checkout before launch? You did the WhatsApp button for free.” Enter two hours, turn memory OFF, and assess. Point to Needs Review and the empty evidence section.

**0:55–1:35.** Start a New Chat. Use the exact request again, turn memory ON, and enter two hours. Show Billable. Point to the dated agreement excluding online payments, the one-time courtesy, the returned source IDs, and the ₹3,000 estimate from ₹1,500 per hour × two hours. Show the editable template reply.

**1:35–2:20.** Record the fictional client's explicit Razorpay approval. Start a New Chat and assess the same request with memory ON. Read the Oct 14 amendment line and show the source ID. Point out that the result has no extra-work estimate.

**2:20–3:00.** Ask “Can you add Stripe checkout?” Show Billable. Ask “Can shoppers pay directly on the website?” and show the provider question. Close by explaining how a narrowly worded approval changes one decision.

## English technical article draft

### What changed when a client approved one checkout provider?

A freelancer can remember adding a WhatsApp button for free and still need the written agreement to decide how to handle a request for checkout. I built ScopeKeeper, a local prototype for reviewing website scope changes, around that difference.

The fictional agreement covers a five-page website with a contact form and excludes online payments. A dated courtesy records a free WhatsApp contact button. The app gives the freelancer three possible outcomes and shows the dated source behind the decision. For billable work, it multiplies a confirmed hourly rate by hours entered by the freelancer. It also provides an editable reply template.

The application has a server-side Hindsight adapter for retaining and recalling records. Returned evidence is checked against the project's source IDs and approved text before the rules use it. The tests used clearly labeled simulation while live Hindsight verification was pending. In the tested demo, turning memory off returned Needs Review. Turning it on returned Billable and a ₹3,000 estimate for two hours. Recording a Razorpay approval changed Razorpay to Included. Stripe remained Billable.

An incoming message can describe an approval, but recording it requires a separate freelancer action. If a recorded approval is missing from the returned evidence, ScopeKeeper asks the freelancer to verify it. That protects the decision from relying on an outdated exclusion after the terms have changed.

## LinkedIn draft

I built ScopeKeeper to explore a question freelancers face before launch. Does this client request belong in the original scope?

In my fictional demo, the agreement excluded online payments and a WhatsApp button had been added as a one-time courtesy. ScopeKeeper showed the dated evidence and a ₹3,000 estimate for adding Razorpay. After I recorded the client's approval, Razorpay moved to Included and Stripe stayed Billable.

The prototype uses a local Python server and editable reply templates. I verified the demo in labeled simulation. Live Hindsight verification is pending.

## Reddit draft

I built a small local prototype for freelancers reviewing website scope changes. The test case is a checkout request that mentions a previous free WhatsApp button. A specific Razorpay amendment changes the Razorpay verdict and leaves Stripe billable. The app shows the source IDs and dates behind each decision. The walkthrough currently uses labeled simulated retrieval. For freelancers who track changes manually, what would make an evidence panel practical during a real client conversation?

## Final checklist

- Profile review form complete, as reported by Sanjana.
- Working deadline is November 7, 2026, 11:59 pm IST. Confirm the Bangalore cutoff and form URL with the organizers.
- Confirm solo eligibility, Band AI Desktop, accepted Hindsight hosting, and whether live demo means a public URL, a live presentation, or both.
- Confirm the official Bangalore content guide, link permissions, and required platforms. The Hyderabad-labeled PDF is provisional guidance.
- Extract the ZIP and double-click the launcher. Verify the Windows browser opens. If live mode is available, run the demo and check that Hindsight fact IDs are returned.
- Record the demo from reset. Read the mode badge accurately in the video. Review the recording for secrets and accidental personal data.
- After approval, upload or publish the source, video, article and posts in the confirmed places. Copy the real URLs into the form. Open each in a signed-out browser and verify judges can access it.
- Review the completed form, submit by the confirmed cutoff, and retain the receipt.
