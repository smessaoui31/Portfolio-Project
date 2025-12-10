"use client";

import { useEffect, useState } from "react";
import { apiAuthed } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/lib/toast";

type Category = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  _count: { products: number };
  createdAt: string;
  updatedAt: string;
};

export default function AdminCategoriesPage() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  const fetchCategories = async () => {
    if (!token) return;
    try {
      const data = await apiAuthed<Category[]>("/admin/categories");
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      showToast("Erreur lors du chargement des catégories", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [token]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Le nom est requis", "error");
      return;
    }

    try {
      await apiAuthed("/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          displayOrder: categories.length,
        }),
      });
      showToast("Catégorie créée avec succès", "success");
      setFormData({ name: "", description: "" });
      setIsCreating(false);
      fetchCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      showToast("Erreur lors de la création", "error");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.name.trim()) {
      showToast("Le nom est requis", "error");
      return;
    }

    try {
      await apiAuthed(`/admin/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
        }),
      });
      showToast("Catégorie mise à jour", "success");
      setEditingId(null);
      setFormData({ name: "", description: "" });
      fetchCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      showToast("Erreur lors de la mise à jour", "error");
    }
  };

  const handleDelete = async (id: string, productsCount: number) => {
    if (productsCount > 0) {
      showToast(`Impossible de supprimer : ${productsCount} produit(s) associé(s)`, "error");
      return;
    }

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) return;

    try {
      await apiAuthed(`/admin/categories/${id}`, { method: "DELETE" });
      showToast("Catégorie supprimée", "success");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      showToast("Erreur lors de la suppression", "error");
    }
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({ name: category.name, description: category.description || "" });
    setIsCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ name: "", description: "" });
  };

  const moveCategory = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === categories.length - 1) return;

    const newCategories = [...categories];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];

    // Update display order
    const updates = newCategories.map((cat, i) => ({ id: cat.id, displayOrder: i }));

    try {
      await apiAuthed("/admin/categories/reorder", {
        method: "PATCH",
        body: JSON.stringify({ categories: updates }),
      });
      setCategories(newCategories);
      showToast("Ordre mis à jour", "success");
    } catch (error) {
      console.error("Error reordering:", error);
      showToast("Erreur lors du réordonnancement", "error");
    }
  };

  if (loading) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold text-white">Catégories</h1>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-neutral-400">
          Chargement...
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Catégories</h1>
        <button
          onClick={() => {
            setIsCreating(true);
            setEditingId(null);
            setFormData({ name: "", description: "" });
          }}
          className="px-4 py-2 bg-white text-black rounded-md font-medium hover:bg-neutral-100 transition"
        >
          + Nouvelle catégorie
        </button>
      </div>

      {isCreating && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
          <h2 className="text-lg font-medium text-white mb-4">Créer une catégorie</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Nom *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white h-20"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-white text-black rounded-md font-medium hover:bg-neutral-100 transition"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-neutral-800 text-white rounded-md hover:bg-neutral-700 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-8 text-center text-neutral-400">
            Aucune catégorie. Créez-en une pour commencer.
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {categories.map((category, index) => (
              <div key={category.id} className="p-4">
                {editingId === category.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-neutral-300 mb-1">Nom *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-300 mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white h-20"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(category.id)}
                        className="px-4 py-2 bg-white text-black rounded-md font-medium hover:bg-neutral-100 transition"
                      >
                        Sauvegarder
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-neutral-800 text-white rounded-md hover:bg-neutral-700 transition"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-white">{category.name}</h3>
                      {category.description && (
                        <p className="text-sm text-neutral-400 mt-1">{category.description}</p>
                      )}
                      <p className="text-xs text-neutral-500 mt-2">
                        {category._count.products} produit(s)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveCategory(index, "up")}
                        disabled={index === 0}
                        className="px-2 py-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Monter"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveCategory(index, "down")}
                        disabled={index === categories.length - 1}
                        className="px-2 py-1 text-neutral-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Descendre"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => startEdit(category)}
                        className="px-3 py-1 text-sm text-neutral-300 hover:text-white border border-neutral-700 rounded-md hover:border-neutral-600 transition"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(category.id, category._count.products)}
                        className="px-3 py-1 text-sm text-red-300 hover:text-red-200 border border-red-800 rounded-md hover:border-red-700 transition"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
