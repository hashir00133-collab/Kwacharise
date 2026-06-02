const ledger = [
  { date: "22 May", from: "J.B***", to: "M.P***", amount: "K 500", method: "Airtel Money" },
  { date: "22 May", from: "G.T***", to: "F.Z***", amount: "K 250", method: "MTN MoMo" },
  { date: "21 May", from: "M.L***", to: "P.M***", amount: "K 1000", method: "Airtel Money" },
  { date: "21 May", from: "F.Z***", to: "G.T***", amount: "K 250", method: "USDT TRC20" },
];

export default function LedgerPage() {
  return (
    <main className="min-h-screen bg-[#07090f] px-6 py-8 text-[#dde2ef]">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="mb-8 inline-block rounded-lg bg-[#172036] px-4 py-2 text-sm text-[#7a9abd]">
          ← Back
        </a>

        <h1 className="mb-3 text-3xl font-extrabold">Live Payment Ledger</h1>
        <p className="mb-2 text-[#7a9abd]">
          Recent peer-to-peer payments. Names are anonymised for privacy.
        </p>

        <div className="mb-6 flex items-center gap-2 text-sm font-semibold text-[#00b86b]">
          <span className="h-2 w-2 rounded-full bg-[#00b86b]" />
          Live
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#172036] bg-[#0e1526]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[#172036] text-[#4e6880]">
              <tr>
                <th className="p-4">Date</th>
                <th className="p-4">From</th>
                <th className="p-4">To</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Via</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((item, index) => (
                <tr key={index} className="border-b border-[#172036] last:border-b-0">
                  <td className="p-4 text-[#7a9abd]">{item.date}</td>
                  <td className="p-4 font-mono text-[#7a9abd]">{item.from}</td>
                  <td className="p-4 font-mono text-[#7a9abd]">{item.to}</td>
                  <td className="p-4 font-bold text-[#00b86b]">{item.amount}</td>
                  <td className="p-4">
                    <span className="rounded-md border border-[#60a5fa33] bg-[#60a5fa18] px-2 py-1 text-xs text-[#93c5fd]">
                      {item.method}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}