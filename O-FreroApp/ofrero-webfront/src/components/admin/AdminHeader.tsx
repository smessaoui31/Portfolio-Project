"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useState, useRef, useEffect } from "react";
import { apiAuthed } from "@/lib/api";
import { useRouter } from "next/navigation";

type SearchResults = {
  products: Array<{ id: string; name: string; priceCents: number; category: { name: string } | null }>;
  orders: Array<{ id: string; orderNumber: string; user: { fullName: string; email: string } }>;
  users: Array<{ id: string; fullName: string; email: string; role: string }>;
  categories: Array<{ id: string; name: string }>;
};

export default function AdminHeader() {
  const { email } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = async (value: string) => {
    setSearchQuery(value);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (value.trim().length < 2) {
      setSearchResults(null);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await apiAuthed<SearchResults>(`/admin/search?q=${encodeURIComponent(value)}`);
        setSearchResults(results);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const navigateAndClose = (url: string) => {
    setShowResults(false);
    setSearchQuery("");
    setSearchResults(null);
    router.push(url);
  };

  const totalResults = searchResults
    ? searchResults.products.length +
      searchResults.orders.length +
      searchResults.users.length +
      searchResults.categories.length
    : 0;

  return (
    <header className="flex items-center justify-between gap-3">
      {/* Search */}
      <div className="flex-1 relative" ref={searchRef}>
        <div className="relative">
          <input
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchResults && setShowResults(true)}
            placeholder="Rechercher (commandes, clients, produits, catégories…)"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-white outline-none focus:border-neutral-700"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
              Recherche...
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchResults && totalResults > 0 && (
          <div className="absolute top-full mt-2 w-full bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            {/* Products */}
            {searchResults.products.length > 0 && (
              <div className="p-2 border-b border-neutral-800">
                <div className="px-2 py-1 text-xs font-medium text-neutral-400 uppercase">Produits</div>
                {searchResults.products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => navigateAndClose(`/admin/products/${product.id}`)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-neutral-800 transition"
                  >
                    <div className="text-sm text-white">{product.name}</div>
                    <div className="text-xs text-neutral-400">
                      {product.category?.name} • {(product.priceCents / 100).toFixed(2)} €
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Orders */}
            {searchResults.orders.length > 0 && (
              <div className="p-2 border-b border-neutral-800">
                <div className="px-2 py-1 text-xs font-medium text-neutral-400 uppercase">Commandes</div>
                {searchResults.orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => navigateAndClose(`/admin/orders/${order.id}`)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-neutral-800 transition"
                  >
                    <div className="text-sm text-white">#{order.orderNumber || order.id.slice(0, 8)}</div>
                    <div className="text-xs text-neutral-400">
                      {order.user?.fullName} • {order.user?.email}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Users */}
            {searchResults.users.length > 0 && (
              <div className="p-2 border-b border-neutral-800">
                <div className="px-2 py-1 text-xs font-medium text-neutral-400 uppercase">Utilisateurs</div>
                {searchResults.users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => navigateAndClose(`/admin/users/${user.id}`)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-neutral-800 transition"
                  >
                    <div className="text-sm text-white flex items-center gap-2">
                      {user.fullName}
                      {user.role === "ADMIN" && (
                        <span className="text-xs px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-neutral-400">{user.email}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Categories */}
            {searchResults.categories.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-xs font-medium text-neutral-400 uppercase">Catégories</div>
                {searchResults.categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => navigateAndClose(`/admin/categories`)}
                    className="w-full text-left px-3 py-2 rounded hover:bg-neutral-800 transition"
                  >
                    <div className="text-sm text-white">{category.name}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {showResults && searchResults && totalResults === 0 && searchQuery.length >= 2 && (
          <div className="absolute top-full mt-2 w-full bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl z-50 p-4 text-center text-sm text-neutral-400">
            Aucun résultat trouvé
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          href="/me"
          className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800/70"
          title={email ?? undefined}
        >
          {email ?? "Compte"}
        </Link>
      </div>
    </header>
  );
}
