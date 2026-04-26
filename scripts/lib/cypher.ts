import { Driver, Session } from "neo4j-driver";

export type Counters = { nodesCreated: number; relationshipsCreated: number };

export async function runWrite(
  session: Session,
  cypher: string,
  params: Record<string, unknown> = {}
): Promise<Counters> {
  const res = await session.executeWrite((tx) => tx.run(cypher, params));
  const c = res.summary.counters.updates();
  return {
    nodesCreated: c.nodesCreated,
    relationshipsCreated: c.relationshipsCreated,
  };
}

export async function batchUnwind<T extends Record<string, unknown>>(
  session: Session,
  cypher: string,
  rows: T[],
  extra: Record<string, unknown> = {}
): Promise<Counters> {
  if (rows.length === 0) return { nodesCreated: 0, relationshipsCreated: 0 };
  const res = await session.executeWrite((tx) =>
    tx.run(cypher, { rows, ...extra })
  );
  const c = res.summary.counters.updates();
  return {
    nodesCreated: c.nodesCreated,
    relationshipsCreated: c.relationshipsCreated,
  };
}

export async function withSession<T>(
  driver: Driver,
  database: string,
  fn: (s: Session) => Promise<T>
): Promise<T> {
  const session = driver.session({ database });
  try {
    return await fn(session);
  } finally {
    await session.close();
  }
}
