import { createClerkClient } from "@clerk/backend";
import { env } from "../env";
import { TrueLayerClient } from "../lib/truelayer/client";
import { MonzoClient } from "../lib/monzo/client";
import { Transaction } from "../lib/truelayer/types";
import { redis } from "bun";
import { sendEmail } from "../lib/email";
import { getRefreshToken } from "../lib/util";

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
  const lastSync = (await redis.get(`${userId}_last_sync`)) || undefined;
  const accountLinkDate = await redis.get(`${userId}_link_date`);

  if (!accountLinkDate) {
    handleErr({ err: "No account link date found", name, userId, email });
    return 1;
  }

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
      lastSync,
    });
    return 1;
  }

  const { err: tlError, refreshToken: tLToken } = await getRefreshToken(
    userId,
    "truelayer",
  );

  if (tlError || !tLToken) {
    handleErr({
      err: `Failed to fetch TrueLayer token${tlError ? ` - ${tlError}` : ""}`,
      name,
      userId,
      email,
      lastSync,
    });
    return 1;
  }

  const trueLayerClient = new TrueLayerClient({
    userId,
    refreshToken: tLToken,
  });
  const monzoClient = new MonzoClient({ userId, refreshToken: monzoToken });

  const { accountId: monzoAccountId, potId: monzoPotId } =
    await monzoClient.getStoredAccountIds();

  if (!monzoAccountId || monzoPotId) {
    handleErr({
      err: `Failed to fetch monzo account information`,
      name,
      email,
      userId,
      lastSync,
    });
    return 1;
  }

  const { accountId, accountName } =
    await trueLayerClient.getStoredAccountIds();
  if (!accountId || !accountName) {
    handleErr({
      err: `Failed to fetch true layer account information`,
      name,
      email,
      userId,
      lastSync,
    });
    return 1;
  }

  const from =
    lastSync && lastSync > accountLinkDate ? lastSync : accountLinkDate;
  const to = new Date().toISOString().split("T")[0]!;

  let transactions: Transaction[];

  try {
    transactions = await getTransactions({
      accountId,
      from,
      to,
      client: trueLayerClient,
      userId,
    });
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

  const { processedEntries, newTransactions } = await filterTransactions({
    transactions,
    userId,
    from,
  });

  const failedEntries = await getFailedEntries(userId);
  const stillFailing: FailedEntry[] = [];

  for (const entry of failedEntries) {
    if (entry.retries >= MAX_RETRIES) {
      handleErr({
        err: `Giving up on transaction ${entry.transaction_id} after ${entry.retries} retries.`,
        name,
        userId,
        email,
        ccAccount: accountName,
      });
      continue;
    }

    const success = await attemptDeposit({
      client: monzoClient,
      depositOptions: {
        accountId: entry.monzoAccountId,
        potId: entry.monzoPotId,
        dedupeId: entry.transaction_id,
        amount: entry.amount,
      },
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

  const newlyFailed: FailedEntry[] = [];

  for (const transaction of newTransactions) {
    if (transaction.transaction_type === "CREDIT") {
      const success = await attemptWithdrawal({
        client: monzoClient,
        withdrawalOptions: {
          accountId: monzoAccountId,
          potId: monzoPotId,
          amount: Math.abs(transaction.amount),
          dedupeId: transaction.transaction_id,
        },
      });

      if (success) {
        processedEntries.push({
          id: transaction.transaction_id,
          timestamp: new Date(transaction.timestamp).getTime(),
        });
      }
    } else {
      const success = await attemptDeposit({
        client: monzoClient,
        depositOptions: {
          accountId: monzoAccountId,
          potId: monzoPotId,
          amount: Math.abs(transaction.amount),
          dedupeId: transaction.transaction_id,
        },
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
          monzoAccountId,
          monzoPotId,
          retries: 1,
          lastAttempt: Date.now(),
        });
      }
    }
  }

  await redis.set(`${userId}_processed`, JSON.stringify(processedEntries));
  await redis.set(
    `${userId}_failed`,
    JSON.stringify([...stillFailing, ...newlyFailed]),
  );
  await redis.set(`${userId}_last_sync`, to);

  return 0;
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

async function getTransactions({
  accountId,
  from,
  to,
  userId,
  client,
}: {
  accountId: string;
  from: string;
  to: string;
  userId: string;
  client: TrueLayerClient;
}) {
  try {
    return client.getAllTransactions(accountId, from, to);
  } catch (err) {
    console.error(err, { userId });
    return [];
  }
}

async function attemptDeposit({
  depositOptions,
  client,
}: {
  depositOptions: {
    accountId: string;
    potId: string;
    amount: number;
    dedupeId: string;
  };
  client: MonzoClient;
}) {
  try {
    await client.depositToPot(depositOptions);
    return true;
  } catch (err) {
    console.error("Deposit to failed", { err, depositOptions });
    return false;
  }
}

async function attemptWithdrawal({
  withdrawalOptions,
  client,
}: {
  withdrawalOptions: {
    accountId: string;
    potId: string;
    amount: number;
    dedupeId: string;
  };
  client: MonzoClient;
}) {
  try {
    await client.withdrawFromPot(withdrawalOptions);
    return true;
  } catch (err) {
    console.error("Withdrawal failed", { err, withdrawalOptions });
  }
}

async function filterTransactions({
  transactions,
  userId,
  from,
}: {
  transactions: Transaction[];
  userId: string;
  from: string;
}) {
  const raw = await redis.get(`${userId}_processed`);
  const fromMs = new Date(from).getTime();

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

function handleErr({
  err,
  name,
  ccAccount,
  email,
  userId,
  lastSync,
}: {
  err?: string | Error;
  name?: string | null;
  ccAccount?: string;
  email?: string;
  userId: string;
  lastSync?: string;
}) {
  console.error(err, { userId });

  if (email) {
    const variables: Record<string, string> = {};
    if (name) variables.name = name;
    if (ccAccount) variables.cc_account = ccAccount;
    if (lastSync) variables.last_sync = lastSync;

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
