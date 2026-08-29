"use client";

import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeLanguage, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <Select
        value={i18n.language || "en"}
        onValueChange={(value) => changeLanguage(value as SupportedLanguage)}
      >
        <SelectTrigger className="h-9 w-[150px] rounded-full">
          <SelectValue placeholder={t("common.language")} />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              {language.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
