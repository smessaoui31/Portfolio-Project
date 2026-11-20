import { beforeEach, expect, test } from "vitest";
import { editionBounds } from "@/domain/editions";
import { prisma } from "@/lib/db";
import { getHomeData } from "./catalog";
import { castVote, createPoll, deletePoll, getPollView, listPollsAdmin } from "./polls";
import { resetDb } from "./test/db";
import { makeEdition, makeProduct, makeUser } from "./test/fixtures";

const NOW = new Date("2026-11-20T12:00:00Z");
const AFTER_CLOSE = new Date("2026-11-27T12:00:00Z");
const AFTER_NEXT_EDITION = new Date("2027-01-02T12:00:00Z");

beforeEach(resetDb);

async function openPoll() {
  const created = await createPoll(
    { title: "La prochaine pizza du moment", closesOn: "2026-11-25", candidates: [{ name: "Burrata" }, { name: "Truffe", description: "Crème de truffe" }, { name: "Chorizo" }] },
    NOW,
  );
  if (!created.ok) throw new Error(created.message);
  const candidates = await prisma.pollCandidate.findMany({ where: { pollId: created.id }, orderBy: { position: "asc" } });
  return { id: created.id, candidates };
}

test("createPoll needs three named candidates and a future closing day", async () => {
  expect(await createPoll({ title: "x", closesOn: "2026-12-20", candidates: [{ name: "a" }, { name: "b" }] }, NOW)).toMatchObject({ ok: false });
  expect(await createPoll({ title: "x", closesOn: "2026-12-20", candidates: [{ name: "a" }, { name: " " }, { name: "c" }] }, NOW)).toMatchObject({ ok: false });
  expect(await createPoll({ title: "x", closesOn: "2026-11-01", candidates: [{ name: "a" }, { name: "b" }, { name: "c" }] }, NOW)).toMatchObject({ ok: false });
  const { id } = await openPoll();
  expect((await prisma.poll.findUniqueOrThrow({ where: { id } })).closesAt.toISOString()).toBe("2026-11-25T23:00:00.000Z");
});

test("percentages stay hidden until the user votes", async () => {
  const { candidates } = await openPoll();
  const voter = await makeUser();
  await castVote((await makeUser()).id, candidates[0].id, NOW);
  const before = await getPollView(NOW, voter.id);
  expect(before).toMatchObject({ closed: false, myCandidateId: null });
  expect(before!.candidates.every((c) => c.percent === null)).toBe(true);
  expect(before!.candidates.map((c) => c.name)).toEqual(["Burrata", "Truffe", "Chorizo"]);

  expect(await castVote(voter.id, candidates[1].id, NOW)).toEqual({ ok: true });
  const after = await getPollView(NOW, voter.id);
  expect(after).toMatchObject({ myCandidateId: candidates[1].id });
  expect(after!.candidates.map((c) => c.percent)).toEqual([50, 50, 0]);
});

test("a second vote is refused, and votes after closing too", async () => {
  const { candidates } = await openPoll();
  const u = await makeUser();
  expect(await castVote(u.id, candidates[0].id, NOW)).toEqual({ ok: true });
  expect(await castVote(u.id, candidates[1].id, NOW)).toEqual({ ok: false, error: "ALREADY_VOTED" });
  expect(await castVote((await makeUser()).id, candidates[0].id, AFTER_CLOSE)).toEqual({ ok: false, error: "CLOSED" });
  expect(await castVote(u.id, "nope", NOW)).toEqual({ ok: false, error: "NOT_FOUND" });
});

test("once closed, results show the winner first, even to non voters", async () => {
  const { candidates } = await openPoll();
  for (const index of [2, 2, 0]) await castVote((await makeUser()).id, candidates[index].id, NOW);
  const view = await getPollView(AFTER_CLOSE, null);
  expect(view).toMatchObject({ closed: true });
  expect(view!.candidates[0]).toMatchObject({ name: "Chorizo", percent: 67 });
});

test("the poll disappears once the next edition has started", async () => {
  await openPoll();
  const bounds = editionBounds("2027-01-01", "2027-02-28");
  await makeEdition({ number: 2, startsAt: bounds.startsAt, endsAt: bounds.endsAt });
  expect(await getPollView(AFTER_CLOSE, null)).not.toBeNull();
  expect(await getPollView(AFTER_NEXT_EDITION, null)).toBeNull();
});

test("admin lists polls with counts and deletes them", async () => {
  const { id, candidates } = await openPoll();
  await castVote((await makeUser()).id, candidates[0].id, NOW);
  const [poll] = await listPollsAdmin();
  expect(poll.candidates.map((c) => c.votes)).toEqual([1, 0, 0]);
  await deletePoll(id);
  expect(await prisma.poll.count()).toBe(0);
});

test("home data reveals only the number and start of the next edition", async () => {
  const product = await makeProduct({ name: "Secrète", isEditionOnly: true });
  const bounds = editionBounds("2027-01-01", "2027-02-28");
  await makeEdition({ number: 2, productId: product.id, startsAt: bounds.startsAt, endsAt: bounds.endsAt });
  const home = await getHomeData(NOW);
  expect(home.next).toEqual({ number: 2, startsAt: "2026-12-31T23:00:00.000Z" });
  expect(JSON.stringify(home)).not.toContain("Secrète");
  expect((await getHomeData(AFTER_NEXT_EDITION)).next).toBeNull();
});
