import { TranslationFiles, TranslationRecord } from "@/types/translation";

/**
 * Convert three language JSON files into table rows.
 */
export function mergeTranslations(
  files: TranslationFiles
): TranslationRecord[] {
  const keys = new Set<string>([
    ...Object.keys(files.en),
    ...Object.keys(files.am),
    ...Object.keys(files.om),
  ]);

  return Array.from(keys)
    .sort()
    .map((key) => ({
      key,
      en: files.en[key] ?? "",
      am: files.am[key] ?? "",
      om: files.om[key] ?? "",
    }));
}

/**
 * Convert table rows back into language JSON objects.
 */
export function splitTranslations(
  rows: TranslationRecord[]
): TranslationFiles {
  const en: Record<string, string> = {};
  const am: Record<string, string> = {};
  const om: Record<string, string> = {};

  rows.forEach((row) => {
    en[row.key] = row.en;
    am[row.key] = row.am;
    om[row.key] = row.om;
  });

  return {
    en,
    am,
    om,
  };
}

/**
 * Download one JSON file.
 */
export function downloadJson(
  filename: string,
  data: Record<string, string>
) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}