"use client";

import { useLanguage } from "./LanguageProvider";

export default function TranslatedText({ text }: { text: string }) {
  const { t } = useLanguage();
  return <>{t(text)}</>;
}
