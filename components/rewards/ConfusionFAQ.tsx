export default function ConfusionFAQ() {
  const faqs = [
    {
      title: "Why don't I have points yet?",
      body:
        'Points accrue from buys, sells, referrals, and LP migration on Sepolia. Make a trade and wait for the next indexer refresh (~15s) to see updates.'
    },
    {
      title: 'Why is my reward lower than my leaderboard score?',
      body:
        'Leaderboard score shows raw activity. Reward-eligible points remove self-swaps or referral abuse, and effective points add time weighting plus caps, so payouts can be smaller.'
    },
    {
      title: "Why can't I claim right now?",
      body:
        'Claims stay disabled in Sepolia test mode and require a valid Merkle proof plus open claim window. Production will route through the rewards distributor contract.'
    }
  ];

  return (
    <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-white">
      <p className="text-sm font-semibold text-white/80">Need clarity?</p>
      <div className="space-y-2">
        {faqs.map((faq) => (
          <details key={faq.title} className="rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm">
            <summary className="cursor-pointer select-none font-semibold">{faq.title}</summary>
            <p className="mt-1 text-white/70">{faq.body}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
