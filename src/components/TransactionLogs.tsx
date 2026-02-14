import type { TxLog } from "../types/app";

type TransactionLogsProps = {
  txLogs: TxLog[];
};

export function TransactionLogs({ txLogs }: TransactionLogsProps) {
  return (
    <div>
      <strong>Transaction logs:</strong>
      {txLogs.length === 0 ? (
        <p className="muted">No transactions yet.</p>
      ) : (
        txLogs.map((tx) => (
          <p key={tx.hash}>
            {tx.label}:{" "}
            <a href={tx.url} target="_blank" rel="noreferrer">
              {tx.hash}
            </a>
          </p>
        ))
      )}
    </div>
  );
}
