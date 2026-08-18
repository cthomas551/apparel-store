const COMMON_PATTERNS = [
  "password",
  "123456",
  "12345678",
  "123456789",
  "qwerty",
  "letmein",
  "welcome",
  "admin",
  "iloveyou",
  "monkey",
  "dragon",
  "abc123",
  "111111",
  "000000",
  "123123",
];

const SEQUENTIAL_DIGITS =
  /(?:0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)/;

const SPECIAL_CHAR = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/;

function hasCommonPattern(password: string): boolean {
  const lower = password.toLowerCase();
  return COMMON_PATTERNS.some((pattern) => lower.includes(pattern)) || SEQUENTIAL_DIGITS.test(password);
}

export type PasswordCheck = { id: string; label: string; passed: boolean };

export function getPasswordChecks(password: string, email: string): PasswordCheck[] {
  const emailLocal = email.split("@")[0]?.toLowerCase().trim() ?? "";

  return [
    { id: "length", label: "At least 6 characters", passed: password.length >= 6 },
    { id: "uppercase", label: "One uppercase letter", passed: /[A-Z]/.test(password) },
    { id: "lowercase", label: "One lowercase letter", passed: /[a-z]/.test(password) },
    { id: "number", label: "One number", passed: /[0-9]/.test(password) },
    { id: "special", label: "One special character (!, @, #, $...)", passed: SPECIAL_CHAR.test(password) },
    {
      id: "pattern",
      label: "No common words or sequences",
      passed: password.length > 0 && !hasCommonPattern(password),
    },
    {
      id: "email",
      label: "Doesn't contain your email",
      passed: emailLocal.length < 3 || !password.toLowerCase().includes(emailLocal),
    },
  ];
}

export function isPasswordValid(password: string, email: string): boolean {
  return getPasswordChecks(password, email).every((check) => check.passed);
}
