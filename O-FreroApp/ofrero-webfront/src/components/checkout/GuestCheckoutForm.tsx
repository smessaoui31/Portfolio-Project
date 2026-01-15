// src/components/checkout/GuestCheckoutForm.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Phone, MapPin } from "lucide-react";

export type GuestInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
};

type GuestCheckoutFormProps = {
  onSubmit: (info: GuestInfo) => void;
  loading?: boolean;
};

export default function GuestCheckoutForm({ onSubmit, loading }: GuestCheckoutFormProps) {
  const [formData, setFormData] = useState<GuestInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [errors, setErrors] = useState<Partial<GuestInfo>>({});

  function validate(): boolean {
    const newErrors: Partial<GuestInfo> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email invalide";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Le téléphone est requis";
    } else if (!/^[\d\s+()-]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Numéro de téléphone invalide";
    }

    if (!formData.address.trim()) {
      newErrors.address = "L'adresse est requise";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  }

  function handleChange(field: keyof GuestInfo, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <User className="h-5 w-5" />
          Informations personnelles
        </h3>

        <div className="space-y-4">
          {/* Prénom */}
          <div>
            <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-neutral-300">
              Prénom <span className="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              className={`w-full rounded-lg border ${
                errors.firstName ? "border-red-500" : "border-neutral-700"
              } bg-neutral-900 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20`}
              placeholder="Jean"
              disabled={loading}
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
            )}
          </div>

          {/* Nom */}
          <div>
            <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-neutral-300">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
              className={`w-full rounded-lg border ${
                errors.lastName ? "border-red-500" : "border-neutral-700"
              } bg-neutral-900 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20`}
              placeholder="Dupont"
              disabled={loading}
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <Mail className="h-5 w-5" />
          Contact
        </h3>

        <div className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-300">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={`w-full rounded-lg border ${
                errors.email ? "border-red-500" : "border-neutral-700"
              } bg-neutral-900 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20`}
              placeholder="jean.dupont@example.com"
              disabled={loading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          {/* Téléphone */}
          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-neutral-300">
              Téléphone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className={`w-full rounded-lg border ${
                  errors.phone ? "border-red-500" : "border-neutral-700"
                } bg-neutral-900 py-2.5 pl-11 pr-4 text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20`}
                placeholder="06 12 34 56 78"
                disabled={loading}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <MapPin className="h-5 w-5" />
          Adresse de livraison
        </h3>

        {/* Adresse */}
        <div>
          <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-neutral-300">
            Adresse complète <span className="text-red-500">*</span>
          </label>
          <textarea
            id="address"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            rows={3}
            className={`w-full rounded-lg border ${
              errors.address ? "border-red-500" : "border-neutral-700"
            } bg-neutral-900 px-4 py-2.5 text-white placeholder-neutral-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20`}
            placeholder="123 Rue de la Paix, 75001 Paris"
            disabled={loading}
          />
          {errors.address && (
            <p className="mt-1 text-sm text-red-400">{errors.address}</p>
          )}
        </div>
      </div>

      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full rounded-lg bg-white py-3.5 font-semibold text-black transition-all hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Traitement en cours..." : "Continuer vers le paiement"}
      </motion.button>

      <p className="text-center text-sm text-neutral-400">
        Tous les champs marqués d'un <span className="text-red-500">*</span> sont obligatoires
      </p>
    </motion.form>
  );
}
