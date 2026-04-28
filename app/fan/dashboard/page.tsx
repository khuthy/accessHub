"use client";

import { useEffect, useState } from "react";
import { Coins, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  note: string | null;
  createdAt: string;
}

interface WalletData {
  balance: number;
  transactions: Transaction[];
}

export default function FanDashboard() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tokens")
      .then((r) => r.json())
      .then((data) => {
        setWallet(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-zinc-400 text-center py-20">Loading wallet…</div>;
  }

  return (
    <div className="space-y-8 max-w-lg">
      <h1 className="text-2xl font-bold text-zinc-50">My Wallet</h1>

      {/* Balance card */}
      <div className="bg-zinc-900 border border-brand-800 rounded-2xl p-6 flex items-center gap-4">
        <div className="w-14 h-14 gradient-brand rounded-xl flex items-center justify-center flex-shrink-0">
          <Coins className="w-7 h-7 text-white" />
        </div>
        <div>
          <p className="text-sm text-zinc-400">Token balance</p>
          <p className="text-4xl font-bold text-zinc-50">{wallet?.balance ?? 0}</p>
          <p className="text-xs text-zinc-500 mt-0.5">
            1 token ≈ R1 (PayFast top-up coming soon)
          </p>
        </div>
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-3">Transaction history</h2>
        {!wallet?.transactions.length ? (
          <p className="text-sm text-zinc-500">No transactions yet.</p>
        ) : (
          <div className="space-y-2">
            {wallet.transactions.map((tx) => {
              const isIn = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isIn ? "bg-green-950 text-green-400" : "bg-brand-950 text-brand-400"
                    }`}
                  >
                    {isIn ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-zinc-100 truncate">
                      {tx.note ?? tx.type}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={`text-sm font-bold flex-shrink-0 ${
                      isIn ? "text-green-400" : "text-brand-400"
                    }`}
                  >
                    {isIn ? "+" : ""}
                    {tx.amount}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
