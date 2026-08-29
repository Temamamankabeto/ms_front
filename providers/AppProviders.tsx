"use client";

import I18nProvider from "@/providers/I18nProvider";
import ReactQueryProvider from "@/providers/react-query-provider";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReactQueryProvider>
      <I18nProvider>
        {children}
      </I18nProvider>
    </ReactQueryProvider>
  );
}