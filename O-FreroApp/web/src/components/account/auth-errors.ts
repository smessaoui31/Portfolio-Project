const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou mot de passe incorrect.",
  INVALID_EMAIL: "Cette adresse e-mail n'est pas valide.",
  INVALID_PASSWORD: "Mot de passe incorrect.",
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cette adresse. Connecte-toi.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Un compte existe déjà avec cette adresse. Connecte-toi.",
  PASSWORD_TOO_SHORT: "Le mot de passe doit faire au moins 8 caractères.",
  PASSWORD_TOO_LONG: "Le mot de passe est trop long.",
  INVALID_TOKEN: "Ce lien n'est plus valide. Demande un nouveau lien.",
  TOO_MANY_REQUESTS: "Trop de tentatives. Réessaie dans un instant.",
};

/** French message for a Better Auth client error. */
export function authErrorMessage(error: { code?: string; status?: number } | null | undefined): string {
  if (!error) return "";
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
  if (error.status === 429) return MESSAGES.TOO_MANY_REQUESTS;
  return "Une erreur est survenue. Réessaie.";
}
