import { createClerkClient } from "@clerk/backend";
import { env } from "../env";
import { redis } from "bun";
import { getRefreshToken } from "../lib/util";
import { sendEmail } from "../lib/email";
import { TrueLayerClient } from "../lib/truelayer/client";
import { MonzoClient } from "../lib/monzo/client";
import { Transaction } from "../lib/truelayer/types";

async function run(userId: string) {
  const user = await getUser(userId);

  if (!user) return 1;

  const lastSync = await redis.get(`${userId}_last_sync`);
  const accountInfo = await redis.get(`${userId}_ccinf`);

  if (!accountInfo) {
    handleErr({
      err: "Failed to fetch cc account info",
      lastSync,
      name: user.firstName,
      userId,
      email: user.primaryEmailAddress?.emailAddress,
    });

    return 1;
  }

  const monzoInfo = await redis.get(`${userId}_monzoid`);

  if (!monzoInfo) {
    handleErr({
      err: "Failed to fetch Monzo account id",
      lastSync,
      name: user.firstName,
      userId,
      email: user.primaryEmailAddress?.emailAddress,
    });

    return 1;
  }

  const [monzoAccountId, monzoPotId] = monzoInfo?.split(";");

  const [accountId, accountName] = accountInfo.split(";");

  const { err: monzoError, refreshToken: monzoToken } = await getRefreshToken(
    userId,
    "monzo",
  );

  if (monzoError || !monzoToken) {
    handleErr({
      err: `Failed to fetch Monzo Token${monzoError ? ` - ${monzoError}` : ""}`,
      lastSync,
      name: user.firstName,
      userId,
      email: user.primaryEmailAddress?.emailAddress,
      ccAccount: accountName || undefined,
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
      lastSync,
      name: user.firstName,
      userId,
      email: user.primaryEmailAddress?.emailAddress,
      ccAccount: accountName || undefined,
    });

    return 1;
  }

  let transactions: Transaction[];
  try {
    transactions = await getTransactions(tLToken, accountId);
  } catch (err) {
    handleErr({
      err: String(err),
      lastSync,
      name: user.firstName,
      userId,
      email: user.primaryEmailAddress?.emailAddress,
      ccAccount: accountName || undefined,
    });

    return 1;
  }

  const filteredTransactions = await filterTransactions(transactions, userId);

  if (!filterTransactions.length) return 0;

  try {
    handleMonzoSync(
      monzoToken,
      filteredTransactions,
      monzoAccountId,
      monzoPotId,
    );
  } catch (err) {
    handleErr({
      err: String(err),
      lastSync,
      name: user.firstName,
      userId,
      email: user.primaryEmailAddress?.emailAddress,
      ccAccount: accountName || undefined,
    });

    return 1;
  }

  return 0;
}

async function handleMonzoSync(
  refreshToken: string,
  transactions: Transaction[],
  accountId: string,
  potId: string,
) {
  const monzoClient = new MonzoClient({ refreshToken });

  for (const transaction of transactions) {
    monzoClient.depositToPot({
      accountId,
      potId,
      amount: transaction.amount,
      dedupeId: transaction.transaction_id,
    });
  }
}

async function filterTransactions(transactions: Transaction[], userId: string) {
  const processedTransactions = await redis.get(`${userId}_processed`);
  if (!processedTransactions) return transactions;

  const filteredTransactions = transactions.filter(
    (transaction) =>
      !processedTransactions.includes(transaction.transaction_id),
  );

  return filteredTransactions;
}

async function getTransactions(refreshToken: string, accountId: string) {
  const trueLayerClient = new TrueLayerClient({ refreshToken });

  const date = new Date();
  const to = date.toISOString().split("T")[0];
  date.setDate(date.getDate() - 90);
  const from = date.toISOString().split("T")[0];

  const transactions = await trueLayerClient.getAllTransactions(
    accountId,
    from,
    to,
  );
  return transactions;
}
async function getUser(userId: string) {
  const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

  let user;

  try {
    user = await clerkClient.users.getUser(userId);
    if (!user) throw new Error(`Failed to fetch user`);
  } catch (err) {
    console.error(err, { userId });
    return undefined;
  }

  return user;
}

function handleErr({
  err,
  fallback,
  lastSync,
  name,
  ccAccount,
  email,
  userId,
}: {
  err?: string;
  fallback?: string;
  lastSync?: string | null;
  name?: string | null;
  ccAccount?: string | undefined;
  email?: string;
  userId: string;
}) {
  console.error(err ?? fallback, { userId });

  const variables: Record<string, string> = {};

  if (lastSync) {
    variables.last_sync = lastSync;
  }

  if (name) {
    variables.name = name;
  }

  if (ccAccount) {
    variables.cc_account = ccAccount;
  }

  if (email) {
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
