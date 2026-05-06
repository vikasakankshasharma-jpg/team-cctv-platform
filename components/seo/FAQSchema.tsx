import Script from "next/script";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSchemaProps {
  cityName: string;
  // Optional custom FAQs, otherwise defaults are used
  faqs?: FAQItem[];
}

export default function FAQSchema({ cityName, faqs }: FAQSchemaProps) {
  const defaultFaqs: FAQItem[] = [
    {
      question: `What is the cost of CCTV installation in ${cityName}?`,
      answer: `The cost of CCTV installation in ${cityName} depends on the number of cameras, technology (HD vs IP), and cabling requirements. Use our 2-minute Configurator Wizard to get an exact quote tailored to your property.`
    },
    {
      question: `Which is the best CCTV brand for home security in ${cityName}?`,
      answer: `Top brands like CP Plus, Hikvision, and Dahua offer excellent reliability. We recommend CP Plus for standard home setups and Hikvision for IP-based advanced requirements.`
    },
    {
      question: `Do you provide maintenance services in ${cityName}?`,
      answer: `Yes, we offer Annual Maintenance Contracts (AMC) that include regular servicing, priority support, and hardware replacement assistance across ${cityName}.`
    }
  ];

  const itemsToUse = faqs || defaultFaqs;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": itemsToUse.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <Script
      id={`schema-faq-${cityName.toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
