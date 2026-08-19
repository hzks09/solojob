import { describe, expect, it } from "vitest";
import { destinationForType, parseEmailLinkType } from "./email-link";

describe("parseEmailLinkType", () => {
  it("accepte les types émis par Supabase", () => {
    expect(parseEmailLinkType("signup")).toBe("signup");
    expect(parseEmailLinkType("recovery")).toBe("recovery");
    expect(parseEmailLinkType("email_change")).toBe("email_change");
  });

  it("rejette un type absent ou inconnu plutôt que de le transmettre à verifyOtp", () => {
    expect(parseEmailLinkType(null)).toBeNull();
    expect(parseEmailLinkType("")).toBeNull();
    expect(parseEmailLinkType("Signup")).toBeNull();
    expect(parseEmailLinkType("../../admin")).toBeNull();
  });
});

describe("destinationForType", () => {
  it("envoie un lien de réinitialisation sur le formulaire même sans `next`", () => {
    expect(destinationForType("recovery", null)).toBe("/reset-password");
  });

  it("envoie un changement d'adresse sur le profil même sans `next`", () => {
    expect(destinationForType("email_change", null)).toBe("/settings");
  });

  it("envoie une confirmation d'inscription sur le dashboard par défaut", () => {
    expect(destinationForType("signup", null)).toBe("/dashboard");
  });

  it("respecte un `next` interne", () => {
    expect(destinationForType("signup", "/liste")).toBe("/liste");
    expect(destinationForType("recovery", "/reset-password")).toBe("/reset-password");
  });

  it("ignore une destination externe — pas de redirection ouverte via l'e-mail", () => {
    expect(destinationForType("signup", "https://evil.example")).toBe("/dashboard");
    expect(destinationForType("recovery", "//evil.example")).toBe("/reset-password");
  });
});
