import "./globals.css";
import { DocsLayout, RootProvider } from "fumadocs-ui";
import type { ReactNode } from "react";
import { navigation } from "./navigation";

export const metadata = { title: "Interview SDK Docs" };

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootProvider>
      <DocsLayout
        tree={navigation as any}
        nav={{ title: "Interview SDK" }}
        sidebar={{}}
      >
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
