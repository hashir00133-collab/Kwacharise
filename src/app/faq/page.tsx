const faqs = [
  {
    q: "What is the minimum deposit?",
    a: "The minimum deposit is K250 via Airtel Money, MTN MoMo, or USDT TRC20.",
  },
  {
    q: "How long does my money take to mature?",
    a: "Your investment matures after 3 days from the moment admin confirms your deposit.",
  },
  {
    q: "Can I withdraw my capital?",
    a: "No. Only your 50% profit is withdrawable. Your capital automatically reinvests for your next cycle.",
  },
  {
    q: "How many times can I withdraw?",
    a: "You can complete 4 withdrawal cycles. After that your account expires and you must re-deposit to reactivate.",
  },
  {
    q: "Who pays me when I withdraw?",
    a: "New members who are depositing are paired with you and send funds directly to your mobile number.",
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]">
          ← Back
        </a>

        <h1 className="mb-3 text-3xl font-extrabold">Frequently Asked Questions</h1>
        <p className="mb-8 text-[#7a9abd]">
          Everything you need to know about KwachaRise.
        </p>

        <div className="rounded-2xl border border-[#172036] bg-[#0e1526] p-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="border-b border-[#172036] py-5 last:border-b-0">
              <h2 className="mb-2 font-bold">{faq.q}</h2>
              <p className="text-sm leading-6 text-[#7a9abd]">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}