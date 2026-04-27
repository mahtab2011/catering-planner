export type PasswordStrength = {
  valid: boolean;
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
};

export function isStrongPassword(password: string): PasswordStrength {
  const value = password || "";

  const minLength = value.length >= 8;
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);

  return {
    valid: minLength && hasUppercase && hasLowercase && hasNumber,
    minLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
  };
}

export function getPasswordError(password: string) {
  const rules = isStrongPassword(password);

  if (!password) return "Password is required.";

  if (rules.valid) return "";

  const messages: string[] = [];

  if (!rules.minLength) messages.push("at least 8 characters");
  if (!rules.hasUppercase) messages.push("one uppercase letter");
  if (!rules.hasLowercase) messages.push("one lowercase letter");
  if (!rules.hasNumber) messages.push("one number");

  return `Password must include ${messages.join(", ")}.`;
}