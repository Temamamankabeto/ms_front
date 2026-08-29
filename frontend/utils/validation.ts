import {
  TranslationRecord,
  ValidationResult,
} from "@/types/translation";

export function validateTranslation(
  translation: TranslationRecord,
  existing: TranslationRecord[]
): ValidationResult {
  const errors: string[] = [];

  if (!translation.key.trim()) {
    errors.push("Translation key is required.");
  }

  if (!translation.en.trim()) {
    errors.push("English translation is required.");
  }

  if (!translation.am.trim()) {
    errors.push("Amharic translation is required.");
  }

  if (!translation.om.trim()) {
    errors.push("Afaan Oromo translation is required.");
  }

  const duplicate = existing.find(
    (item) =>
      item.key === translation.key &&
      item !== translation
  );

  if (duplicate) {
    errors.push("Duplicate translation key.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}