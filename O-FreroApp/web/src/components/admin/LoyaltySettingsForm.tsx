"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { saveLoyaltyAction } from "@/app/actions/admin-settings";
import { Button } from "@/components/ui/Button";
import { Field, Input, inputClasses } from "@/components/ui/Field";

export function LoyaltySettingsForm({
  initial,
  products,
}: {
  initial: { stampsForReward: number; featuredProductId: string | null; pickupLeadMinutes: number; deliveryLeadMinutes: number };
  products: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [v, setV] = useState({
    stamps: String(initial.stampsForReward),
    featured: initial.featuredProductId ?? "",
    pickup: String(initial.pickupLeadMinutes),
    delivery: String(initial.deliveryLeadMinutes),
  });
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const result = await saveLoyaltyAction({
      stampsForReward: Number(v.stamps),
      featuredProductId: v.featured || null,
      pickupLeadMinutes: Number(v.pickup),
      deliveryLeadMinutes: Number(v.delivery),
    });
    setMessage(result.ok ? { ok: true, text: "Réglages enregistrés." } : { ok: false, text: result.message });
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-5">
      <Field label="Tampons pour une pizza offerte" hint="Entre 2 et 50.">
        {(p) => <Input {...p} type="number" min={2} max={50} value={v.stamps} onChange={(e) => setV({ ...v, stamps: e.target.value })} required />}
      </Field>
      <Field label="Pizza à l'affiche entre deux éditions" hint="Sans choix, la première pizza de la carte.">
        {(p) => (
          <select {...p} className={inputClasses} value={v.featured} onChange={(e) => setV({ ...v, featured: e.target.value })}>
            <option value="">Automatique</option>
            {products.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.name}
              </option>
            ))}
          </select>
        )}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Délai retrait (min)" hint="Premier créneau proposé.">
          {(p) => <Input {...p} type="number" min={5} max={120} value={v.pickup} onChange={(e) => setV({ ...v, pickup: e.target.value })} required />}
        </Field>
        <Field label="Délai livraison (min)">
          {(p) => <Input {...p} type="number" min={10} max={180} value={v.delivery} onChange={(e) => setV({ ...v, delivery: e.target.value })} required />}
        </Field>
      </div>
      {message ? <p className={`text-sm ${message.ok ? "text-ok" : "text-danger"}`}>{message.text}</p> : null}
      <Button type="submit" size="lg">
        Enregistrer
      </Button>
    </form>
  );
}
