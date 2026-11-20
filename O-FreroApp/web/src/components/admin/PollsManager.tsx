"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createPollAction, deletePollAction } from "@/app/actions/polls";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { formatParisDay } from "@/lib/time";

interface AdminPoll {
  id: string;
  title: string;
  closesAt: string;
  candidates: { id: string; name: string; description: string | null; votes: number }[];
}

const empty = () => [
  { name: "", description: "" },
  { name: "", description: "" },
  { name: "", description: "" },
];

/** Open a vote among three pizzas for the next edition, and follow the results. */
export function PollsManager({ polls }: { polls: AdminPoll[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("Quelle sera la prochaine pizza du moment ?");
  const [closesOn, setClosesOn] = useState("");
  const [candidates, setCandidates] = useState(empty);
  const [error, setError] = useState<string | null>(null);

  async function create(e: FormEvent) {
    e.preventDefault();
    const result = await createPollAction({
      title,
      closesOn,
      candidates: candidates.map((c) => ({ name: c.name, description: c.description || undefined })),
    });
    if (!result.ok) return setError(result.message);
    setError(null);
    setCandidates(empty());
    setClosesOn("");
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-8">
      <p className="text-sm text-muted">
        Le vote le plus récent s&apos;affiche sur l&apos;accueil et la page Éditions, puis son résultat jusqu&apos;au début de l&apos;édition
        suivante. Un vote par compte.
      </p>
      <form onSubmit={create} className="space-y-4 rounded-2xl border border-line p-4">
        <Field label="Question">{(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} required />}</Field>
        <Field label="Dernier jour du vote">{(p) => <Input {...p} type="date" value={closesOn} onChange={(e) => setClosesOn(e.target.value)} required />}</Field>
        {candidates.map((c, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr]">
            <Input
              aria-label={`Pizza candidate ${i + 1}`}
              placeholder={`Pizza ${i + 1}`}
              value={c.name}
              onChange={(e) => setCandidates((list) => list.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
              required
            />
            <Input
              aria-label={`Description de la pizza ${i + 1}`}
              placeholder="Ingrédients (facultatif)"
              value={c.description}
              onChange={(e) => setCandidates((list) => list.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
            />
          </div>
        ))}
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <Button type="submit">Ouvrir le vote</Button>
      </form>

      <ul className="space-y-4">
        {polls.map((poll) => {
          const total = poll.candidates.reduce((sum, c) => sum + c.votes, 0);
          return (
            <li key={poll.id} className="rounded-2xl border border-line p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="font-semibold">{poll.title}</p>
                <p className="text-xs text-muted">Clôture : {formatParisDay(new Date(new Date(poll.closesAt).getTime() - 1))}</p>
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {poll.candidates.map((c) => (
                  <li key={c.id} className="flex justify-between gap-4">
                    <span>{c.name}</span>
                    <span className="tabular-nums text-muted-2">
                      {c.votes} vote{c.votes > 1 ? "s" : ""} · {total ? Math.round((c.votes / total) * 100) : 0} %
                    </span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-3 text-sm text-muted-2 hover:text-danger"
                onClick={async () => {
                  if (!window.confirm(`Supprimer le vote « ${poll.title} » ?`)) return;
                  await deletePollAction(poll.id);
                  router.refresh();
                }}
              >
                Supprimer
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
