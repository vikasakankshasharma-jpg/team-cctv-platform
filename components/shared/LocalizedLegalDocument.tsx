"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Shield,
  Lock,
  Eye,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Wrench,
  CreditCard,
  Scale,
  Info,
} from "lucide-react";
import { useI18nStore } from "@/lib/i18n/store";
import type { LocaleCode } from "@/lib/i18n/mapping";
import { PRIVACY_I18N, TERMS_I18N, interpolateLegalText } from "@/lib/i18n/legal-i18n";

interface LegalMeta {
  lastUpdated: string;
  companyName: string;
  domain: string;
  phone: string;
  email: string;
  address: string;
}

interface LocalizedLegalDocumentProps {
  type: "privacy" | "terms";
  initialLocale: LocaleCode;
  meta: LegalMeta;
}

const PRIVACY_ICONS = [Lock, Eye, Phone];
const TERMS_ICONS = [AlertCircle, Wrench, CreditCard, Scale];

const emptySubscribe = () => () => {};

export function LocalizedLegalDocument({ type, initialLocale, meta }: LocalizedLegalDocumentProps) {
  const storeLocale = useI18nStore((s) => s.locale);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const locale = (mounted ? storeLocale : initialLocale) || "en";

  const isPrivacy = type === "privacy";
  const bundle = isPrivacy
    ? PRIVACY_I18N[locale] || PRIVACY_I18N.en
    : TERMS_I18N[locale] || TERMS_I18N.en;

  const isIndic = locale !== "en";

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto px-6 py-8 md:py-16 md:py-24 w-full">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4 shrink-0" />
          <span>{bundle.backHome}</span>
        </Link>

        {/* Localized clarity note when reading regional language version */}
        {bundle.langNote && (
          <div className="mb-8 flex items-start gap-2.5 text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl px-4 py-3 border border-blue-200 dark:border-blue-800/60">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <span>{bundle.langNote}</span>
          </div>
        )}

        {/* Hero */}
        <div className="flex items-start gap-5 mb-10">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              isPrivacy ? "bg-blue-50 dark:bg-blue-900/30" : "bg-indigo-50 dark:bg-indigo-900/30"
            }`}
          >
            {isPrivacy ? (
              <Shield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            ) : (
              <FileText className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            )}
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white mb-2 leading-[1.2]">
              {bundle.heroTitle}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">
              {interpolateLegalText(bundle.updatedLine, meta)}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div
          className={`grid gap-4 mb-12 p-5 sm:p-6 rounded-2xl border ${
            isPrivacy
              ? "sm:grid-cols-3 bg-blue-50/60 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30"
              : "sm:grid-cols-2 md:grid-cols-4 bg-indigo-50/60 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30"
          }`}
        >
          {bundle.summaryCards.map((card, i) => {
            const Icon = isPrivacy
              ? PRIVACY_ICONS[i % PRIVACY_ICONS.length]
              : TERMS_ICONS[i % TERMS_ICONS.length];
            return (
              <div key={card.title} className="flex items-start gap-3">
                <Icon
                  className={`w-5 h-5 mt-0.5 shrink-0 ${
                    isPrivacy ? "text-blue-600" : "text-indigo-600"
                  }`}
                />
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{card.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Legal Sections */}
        <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-3 prose-p:text-zinc-600 prose-p:dark:text-zinc-400 prose-li:text-zinc-600 prose-li:dark:text-zinc-400">
          {bundle.sections.map((section, idx) => {
            const showTableAfter = isPrivacy && idx === 1 && bundle.table;
            const isLastContact = idx === bundle.sections.length - 1;
            return (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs?.map((p, pIdx) => (
                  <p key={pIdx}>{interpolateLegalText(p, meta)}</p>
                ))}

                {showTableAfter && bundle.table && (
                  <div className="not-prose overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 my-5">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                          {bundle.table.headers.map((h) => (
                            <th
                              key={h}
                              className="text-left px-4 py-3 font-bold text-zinc-700 dark:text-zinc-300"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {bundle.table.rows.map((row) => (
                          <tr key={row[0]}>
                            <td className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-200">
                              {row[0]}
                            </td>
                            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row[1]}</td>
                            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{row[2]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {section.bullets && section.bullets.length > 0 && (
                  <ul>
                    {section.bullets.map((b, bIdx) => (
                      <li key={bIdx}>{interpolateLegalText(b, meta)}</li>
                    ))}
                  </ul>
                )}

                {isLastContact && (
                  <div className="not-prose bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mt-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <p
                          className={`text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 ${
                            isIndic ? "normal-case tracking-normal" : "uppercase tracking-wider"
                          }`}
                        >
                          {bundle.contactCard.businessName}
                        </p>
                        <p className="font-bold text-zinc-900 dark:text-white">{meta.companyName}</p>
                      </div>
                      <div>
                        <p
                          className={`text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 ${
                            isIndic ? "normal-case tracking-normal" : "uppercase tracking-wider"
                          }`}
                        >
                          {bundle.contactCard.address}
                        </p>
                        <p className="text-zinc-700 dark:text-zinc-300">{meta.address}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div>
                          <p
                            className={`text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 ${
                              isIndic ? "normal-case tracking-normal" : "uppercase tracking-wider"
                            }`}
                          >
                            {bundle.contactCard.phone}
                          </p>
                          <a
                            href={`tel:${meta.phone}`}
                            className="text-blue-600 font-semibold hover:underline flex items-center gap-1.5"
                          >
                            <Phone className="w-3.5 h-3.5" /> {meta.phone}
                          </a>
                        </div>
                        <div>
                          <p
                            className={`text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1 ${
                              isIndic ? "normal-case tracking-normal" : "uppercase tracking-wider"
                            }`}
                          >
                            {bundle.contactCard.email}
                          </p>
                          <a
                            href={`mailto:${meta.email}`}
                            className="text-blue-600 font-semibold hover:underline flex items-center gap-1.5"
                          >
                            <Mail className="w-3.5 h-3.5" /> {meta.email}
                          </a>
                        </div>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-1">
                        {bundle.contactCard.responseNote}
                      </p>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
