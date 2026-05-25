import { createClerkClient } from "@clerk/backend";
import { env } from "../env";
import { redis } from "bun";
import { getRefreshToken } from "../lib/util";
import { sendEmail } from "../lib/email";
import { TrueLayerClient } from "../lib/truelayer/client";
import { MonzoClient } from "../lib/monzo/client";
import { Transaction } from "../lib/truelayer/types";

type ProcessedEntry = {
  id: string;
  timestamp: number;
};

type FailedEntry = {
  transaction_id: string;
  amount: number;
  monzoAccountId: string;
  monzoPotId: string;
  retries: number;
  lastAttempt: number;
};

const MAX_RETRIES = 5;

async function run(userId: string) {
  const user = await getUser(userId);
  if (!user) return 1;

  const email = user.primaryEmailAddress?.emailAddress;
  const name = user.firstName;

  // The date the user linked their account — permanent lower bound
  const accountLinkDate = await redis.get(`${userId}_link_date`);
  if (!accountLinkDate) {
    handleErr({ err: "No account link date found", name, userId, email });
    return 1;
  }

  const accountInfo = await redis.get(`${userId}_ccinf`);
  if (!accountInfo) {
    handleErr({ err: "Failed to fetch cc account info", name, userId, email });
    return 1;
  }

  const monzoInfo = await redis.get(`${userId}_monzoid`);
  if (!monzoInfo) {
    handleErr({ err: "Failed to fetch Monzo account id", name, userId, email });
    return 1;
  }

  const [monzoAccountId, monzoPotId] = monzoInfo.split(";");
  const [accountId, accountName] = accountInfo.split(";");

  const { err: monzoError, refreshToken: monzoToken } = await getRefreshToken(
    userId,
    "monzo",
  );
  if (monzoError || !monzoToken) {
    handleErr({
      err: `Failed to fetch Monzo token${monzoError ? ` - ${monzoError}` : ""}`,
      name,
      userId,
      email,
      ccAccount: accountName,
    });
    return 1;
  }

  const { err: tLError, refreshToken: tLToken } = await getRefreshToken(
    userId,
    "truelayer",
  );
  if (tLError || !tLToken) {
    handleErr({
      err: `Failed to fetch TrueLayer token${tLError ? ` - ${tLError}` : ""}`,
      name,
      userId,
      email,
      ccAccount: accountName,
    });
    return 1;
  }

  // Fetch transactions from the later of: account link date, or last sync date.
  // This keeps the window tight on steady-state runs while still catching up
  // on the first run or after a gap.
  const lastSyncFrom = await redis.get(`${userId}_last_sync_from`);
  const from =
    lastSyncFrom && lastSyncFrom > accountLinkDate
      ? lastSyncFrom
      : accountLinkDate;
  const to = new Date().toISOString().split("T")[0]!;

  let transactions: Transaction[];
  try {
    transactions = await getTransactions(tLToken, accountId, from, to);
  } catch (err) {
    handleErr({
      err: String(err),
      name,
      userId,
      email,
      ccAccount: accountName,
    });
    return 1;
  }

  // Filter to only unprocessed transactions, and prune the cache at the same time
  const { processedEntries, newTransactions } = await filterTransactions(
    transactions,
    userId,
    from,
  );

  // Retry previously failed transactions before processing new ones
  const failedEntries = await getFailedEntries(userId);
  const stillFailing: FailedEntry[] = [];

  for (const entry of failedEntries) {
    if (entry.retries >= MAX_RETRIES) {
      // Give up — notify and drop
      handleErr({
        err: `Giving up on transaction ${entry.transaction_id} after ${entry.retries} retries`,
        name,
        userId,
        email,
        ccAccount: accountName,
      });
      continue;
    }

    const success = await attemptDeposit(monzoToken, {
      accountId: entry.monzoAccountId,
      potId: entry.monzoPotId,
      amount: entry.amount,
      dedupeId: entry.transaction_id,
    });

    if (success) {
      processedEntries.push({
        id: entry.transaction_id,
        timestamp: entry.lastAttempt,
      });
    } else {
      stillFailing.push({
        ...entry,
        retries: entry.retries + 1,
        lastAttempt: Date.now(),
      });
    }
  }

  // Process new transactions
  const newlyFailed: FailedEntry[] = [];

  for (const transaction of newTransactions) {
    if (transaction.transaction_type === "CREDIT") {
      // Refund — withdraw from pot
      const success = await attemptWithdraw(monzoToken, {
        accountId: monzoAccountId!,
        potId: monzoPotId!,
        amount: Math.abs(transaction.amount),
        dedupeId: transaction.transaction_id,
      });

      if (success) {
        processedEntries.push({
          id: transaction.transaction_id,
          timestamp: new Date(transaction.timestamp).getTime(),
        });
      }
      // Withdrawals that fail are not retried to avoid over-withdrawing;
      // they'll surface naturally on the next run since the transaction
      // won't be in the processed set
    } else {
      // Debit — deposit to pot
      const success = await attemptDeposit(monzoToken, {
        accountId: monzoAccountId!,
        potId: monzoPotId!,
        amount: Math.abs(transaction.amount),
        dedupeId: transaction.transaction_id,
      });

      if (success) {
        processedEntries.push({
          id: transaction.transaction_id,
          timestamp: new Date(transaction.timestamp).getTime(),
        });
      } else {
        newlyFailed.push({
          transaction_id: transaction.transaction_id,
          amount: Math.abs(transaction.amount),
          monzoAccountId: monzoAccountId!,
          monzoPotId: monzoPotId!,
          retries: 1,
          lastAttempt: Date.now(),
        });
      }
    }
  }

  // Persist updated state
  await redis.set(`${userId}_processed`, JSON.stringify(processedEntries));
  await redis.set(
    `${userId}_failed`,
    JSON.stringify([...stillFailing, ...newlyFailed]),
  );
  await redis.set(`${userId}_last_sync_from`, to);

  return 0;
}

// Returns true on success
async function attemptDeposit(
  refreshToken: string,
  params: {
    accountId: string;
    potId: string;
    amount: number;
    dedupeId: string;
  },
): Promise<boolean> {
  try {
    const monzoClient = new MonzoClient({ refreshToken });
    await monzoClient.depositToPot(params);
    return true;
  } catch (err) {
    console.error("Deposit failed", err);
    return false;
  }
}

// Returns true on success
async function attemptWithdraw(
  refreshToken: string,
  params: {
    accountId: string;
    potId: string;
    amount: number;
    dedupeId: string;
  },
): Promise<boolean> {
  try {
    const monzoClient = new MonzoClient({ refreshToken });
    await monzoClient.withdrawFromPot(params);
    return true;
  } catch (err) {
    console.error("Withdrawal failed", err);
    return false;
  }
}

async function filterTransactions(
  transactions: Transaction[],
  userId: string,
  from: string,
): Promise<{
  processedEntries: ProcessedEntry[];
  newTransactions: Transaction[];
}> {
  const raw = await redis.get(`${userId}_processed`);
  const fromMs = new Date(from).getTime();

  // Parse existing entries and prune anything older than our query window —
  // those transaction IDs will never appear in TrueLayer responses again
  const allEntries: ProcessedEntry[] = raw ? JSON.parse(raw) : [];
  const liveEntries = allEntries.filter((e) => e.timestamp >= fromMs);

  const processedIds = new Set(liveEntries.map((e) => e.id));
  const newTransactions = transactions.filter(
    (t) => !processedIds.has(t.transaction_id),
  );

  return { processedEntries: liveEntries, newTransactions };
}

async function getFailedEntries(userId: string): Promise<FailedEntry[]> {
  const raw = await redis.get(`${userId}_failed`);
  return raw ? JSON.parse(raw) : [];
}

async function getTransactions(
  refreshToken: string,
  accountId: string,
  from: string,
  to: string,
) {
  const trueLayerClient = new TrueLayerClient({ refreshToken });
  return trueLayerClient.getAllTransactions(accountId, from, to);
}

async function getUser(userId: string) {
  const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
  try {
    const user = await clerkClient.users.getUser(userId);
    if (!user) throw new Error("Failed to fetch user");
    return user;
  } catch (err) {
    console.error(err, { userId });
    return undefined;
  }
}

function handleErr({
  err,
  name,
  ccAccount,
  email,
  userId,
}: {
  err?: string;
  name?: string | null;
  ccAccount?: string;
  email?: string;
  userId: string;
}) {
  console.error(err, { userId });

  if (email) {
    const variables: Record<string, string> = {};
    if (name) variables.name = name;
    if (ccAccount) variables.cc_account = ccAccount;

    sendEmail({
      to: email,
      template: {
        id: "sync_failed",
        variables,
      },
    });
  }
}

export default run;
