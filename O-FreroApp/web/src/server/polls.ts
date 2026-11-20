import { z } from "zod";
import { editionBounds } from "@/domain/editions";
import { prisma } from "@/lib/db";

export interface PollView {
  id: string;
  title: string;
  closesAt: string;
  closed: boolean;
  myCandidateId: string | null;
  /** `percent` stays null until the visitor has voted, unless the vote is closed. */
  candidates: { id: string; name: string; description: string | null; percent: number | null }[];
}

/**
 * The latest vote: shown while open, then with its results until the next edition starts.
 */
export async function getPollView(now: Date, userId: string | null): Promise<PollView | null> {
  const poll = await prisma.poll.findFirst({
    orderBy: { createdAt: "desc" },
    include: { candidates: { orderBy: { position: "asc" }, include: { _count: { select: { votes: true } } } } },
  });
  if (!poll) return null;
  const closed = now >= poll.closesAt;
  if (closed) {
    const started = await prisma.edition.count({ where: { startsAt: { gt: poll.closesAt, lte: now } } });
    if (started > 0) return null;
  }
  const mine = userId ? await prisma.pollVote.findUnique({ where: { pollId_userId: { pollId: poll.id, userId } } }) : null;
  const total = poll.candidates.reduce((sum, c) => sum + c._count.votes, 0);
  const reveal = closed || Boolean(mine);
  const candidates = poll.candidates.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    percent: reveal ? (total === 0 ? 0 : Math.round((c._count.votes / total) * 100)) : null,
    votes: c._count.votes,
  }));
  if (closed) candidates.sort((a, b) => b.votes - a.votes);
  return {
    id: poll.id,
    title: poll.title,
    closesAt: poll.closesAt.toISOString(),
    closed,
    myCandidateId: mine?.candidateId ?? null,
    candidates: candidates.map((c) => ({ id: c.id, name: c.name, description: c.description, percent: c.percent })),
  };
}

export async function castVote(
  userId: string,
  candidateId: string,
  now: Date,
): Promise<{ ok: true } | { ok: false; error: "NOT_FOUND" | "CLOSED" | "ALREADY_VOTED" }> {
  const candidate = await prisma.pollCandidate.findUnique({ where: { id: candidateId }, include: { poll: true } });
  if (!candidate) return { ok: false, error: "NOT_FOUND" };
  if (now >= candidate.poll.closesAt) return { ok: false, error: "CLOSED" };
  const { count } = await prisma.pollVote.createMany({
    data: [{ pollId: candidate.pollId, candidateId, userId }],
    skipDuplicates: true,
  });
  return count === 1 ? { ok: true } : { ok: false, error: "ALREADY_VOTED" };
}

/* ---------- Admin ---------- */

const pollSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(80),
  closesOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de clôture invalide."),
  candidates: z
    .array(z.object({ name: z.string().trim().min(1, "Chaque pizza candidate a un nom.").max(60), description: z.string().trim().max(200).optional() }))
    .length(3, "Il faut exactement trois pizzas candidates."),
});

export async function createPoll(
  input: z.input<typeof pollSchema>,
  now: Date,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const parsed = pollSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Informations invalides." };
  // Closes at midnight (Paris) at the end of the chosen day.
  const closesAt = editionBounds(parsed.data.closesOn, parsed.data.closesOn).endsAt;
  if (closesAt <= now) return { ok: false, message: "La date de clôture doit être à venir." };
  const poll = await prisma.poll.create({
    data: {
      title: parsed.data.title,
      closesAt,
      candidates: {
        create: parsed.data.candidates.map((c, position) => ({ name: c.name, description: c.description || null, position })),
      },
    },
  });
  return { ok: true, id: poll.id };
}

export async function listPollsAdmin() {
  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
    include: { candidates: { orderBy: { position: "asc" }, include: { _count: { select: { votes: true } } } } },
  });
  return polls.map((p) => ({
    id: p.id,
    title: p.title,
    closesAt: p.closesAt,
    candidates: p.candidates.map((c) => ({ id: c.id, name: c.name, description: c.description, votes: c._count.votes })),
  }));
}

export async function deletePoll(id: string): Promise<void> {
  await prisma.poll.deleteMany({ where: { id } });
}
