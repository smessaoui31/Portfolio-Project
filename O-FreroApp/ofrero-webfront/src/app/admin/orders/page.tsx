"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiAuthed } from "@/lib/api";
import OrderStatusBadge from "@/components/admin/OrderStatusBadge";
import { toast } from "sonner";

type Order = {
  id: string;
  userEmail: string;
  totalCents: number;
  status: string;
  createdAt: string;
};

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await apiAuthed<Order[]>("/orders");
        setOrders(data);
      } catch (err: any) {
        toast.error("Erreur lors du chargement des commandes", {
          description: err?.message || "Vérifie l’API backend.",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold text-white">Commandes</h1>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 text-neutral-400">
          Chargement des commandes…
        </div>
      </main>
    );
  }

  if (orders.length === 0) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold text-white">Commandes</h1>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 text-neutral-400">
          Aucune commande trouvée.
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Commandes</h1>

      <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/50">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-900 text-neutral-400 border-b border-neutral-800">
            <tr>
              <th className="px-4 py-2 text-left font-medium">ID</th>
              <th className="px-4 py-2 text-left font-medium">Client</th>
              <th className="px-4 py-2 text-left font-medium">Total</th>
              <th className="px-4 py-2 text-left font-medium">Statut</th>
              <th className="px-4 py-2 text-left font-medium">Créée le</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-neutral-800 hover:bg-neutral-800/40 transition"
              >
                <td className="px-4 py-2 text-neutral-300">{order.id}</td>
                <td className="px-4 py-2 text-neutral-300">{order.userEmail}</td>
                <td className="px-4 py-2 text-white font-medium">
                  {(order.totalCents / 100).toFixed(2)} €
                </td>
                <td className="px-4 py-2">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-2 text-neutral-400 text-xs">
                  {new Date(order.createdAt).toLocaleString("fr-FR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}