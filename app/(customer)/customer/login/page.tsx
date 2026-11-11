import { CustomerLoginClient } from "@/components/customer/CustomerLoginClient";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n/server-locale";
import { buildPageMetadata } from "@/lib/i18n/seo-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata("customer_login", await getServerLocale());
}

export default function CustomerLoginPage() {
  return <CustomerLoginClient />;
}
