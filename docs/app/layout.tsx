import "./globals.css";
import { Navbar, RootProvider, SidebarLayout } from "fumadocs-ui";
import type { ReactNode } from "react";
import { navigation } from "./navigation";

export const metadata = { title: "Interview SDK Docs" };

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootProvider>
      <SidebarLayout
        navigation={navigation}
        nav={<Navbar title="Interview SDK" />}
      >
        {children}
      </SidebarLayout>
    </RootProvider>
  );
}
