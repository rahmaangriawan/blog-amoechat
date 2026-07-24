"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";

export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const isExcluded = pathname.startsWith("/dashboard") || pathname.startsWith("/login");

  // Disable gtag tracking globally for admin/login paths, meskipun script sudah ter-load
  // dari public page sebelumnya. Properti `ga-disable-<ID>` dikenali oleh gtag.js.
  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as unknown as Record<string, boolean>)[`ga-disable-${measurementId}`] = isExcluded;
  }, [isExcluded, measurementId]);

  if (isExcluded) return null;

  return (
    <>
      <Script
        async
        data-cfasync="false"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        data-cfasync="false"
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
