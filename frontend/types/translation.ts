export type Language = "en" | "am" | "om";

export interface TranslationRecord {
  key: string;
  en: string;
  am: string;
  om: string;
}

export interface TranslationFiles {
  en: Record<string, string>;
  am: Record<string, string>;
  om: Record<string, string>;
}

export interface TranslationState {
  translations: TranslationRecord[];
  loading: boolean;
  dirty: boolean;
}

export interface ImportResult {
  success: boolean;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}