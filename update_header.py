# -*- coding: utf-8 -*-
file_path = "app/(customer)/layout.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

import re

header_regex = re.compile(r'<header className=\{\`sticky top-0 z-50.*?</header>', re.DOTALL)

new_header = """<header className={`sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-100/50 dark:border-zinc-800/50 shadow-sm transition-all ${isWizard ? 'hidden md:block' : ''}`}>
        <div className="max-w-7xl mx-auto px-2 sm:px-6 py-2 md:py-0 md:h-[80px] flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-0">

          {/* Left / Top Row (Mobile) - Logo & Service Areas */}
          <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-4 shrink-0 w-full md:w-auto border-b border-zinc-100 dark:border-zinc-800/50 md:border-none pb-2 md:pb-0">
            <Link href="/" className="flex items-center group shrink-0">
              <Image 
                src="/logo-horizontal.jpg"
                alt="CCTVQuotation by TEAM"
                width={250}
                height={60}
                className="h-10 sm:h-12 md:h-[52px] w-auto object-contain mix-blend-multiply dark:mix-blend-normal dark:bg-white dark:p-1 dark:rounded-lg transition-transform hover:scale-105 origin-center md:origin-left"
                priority
              />
            </Link>

            <div className="hidden md:block">
              <ServiceAreaModal />
            </div>
          </div>

          {/* Centre - Primary CTA (desktop only) */}
          <div className="hidden lg:flex flex-1 justify-center">
            <GetQuotationButton />
          </div>

          {/* Right / Bottom Row (Mobile) - Navigation & Support */}
          <div className="flex items-center justify-between md:justify-end gap-1.5 sm:gap-3 shrink-0 w-full md:w-auto overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {/* Nav Links */}
            <TrackBookingButton />

            <Link
              href="/login"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-all whitespace-nowrap"
              title="Portal"
            >
              <User className="w-3.5 h-3.5" />
              <span className="inline">
                <TranslatedText tKey="portal" defaultText="Portal" />
              </span>
            </Link>

            {/* Divider */}
            <div className="hidden sm:block w-px h-5 bg-zinc-200 dark:bg-zinc-700"></div>

            {/* Support - Icon+Text on mobile, full on desktop */}
            <a
              href="tel:+917357612865"
              aria-label="Call support"
              className="flex md:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-950/50 transition-all whitespace-nowrap"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="inline"><TranslatedText tKey="call" defaultText="Call" /></span>
            </a>
            <a
              href="tel:+917357612865"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-xs"
            >
              <PhoneCall className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-semibold">+91 73576 12865</span>
            </a>

            <LanguageSwitcher />
          </div>
        </div>
      </header>"""

new_content = header_regex.sub(new_header, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Replaced!")
