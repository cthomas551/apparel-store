const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email);
}

export type AuthErrorField = "email" | "password" | "both";

export function friendlyAuthError(message: string): { message: string; field?: AuthErrorField } {
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return { message: "That email and password don't match our records.", field: "both" };
  }
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return { message: "An account with this email already exists — try logging in instead.", field: "email" };
  }
  if (lower.includes("email not confirmed")) {
    return {
      message: "Please confirm your email first — check your inbox for the link we sent.",
      field: "email",
    };
  }
  if (lower.includes("email")) {
    return { message: "That doesn't look like a valid email address.", field: "email" };
  }
  if (lower.includes("password")) {
    return { message, field: "password" };
  }

  return { message };
}
