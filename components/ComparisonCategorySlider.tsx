"use client";

import Link from "next/link";
import {
  Calendar03Icon,
  DiscountTag01Icon,
  GlobeIcon,
  TelephoneIcon,
  Tv01Icon,
} from "@hugeicons/core-free-icons";
import { HugeIcon } from "@/components/HugeIcon";

type CategoryItem = {
  category: string;
  href?: string | null;
};

const categoryIcons = [GlobeIcon, TelephoneIcon, Tv01Icon, Tv01Icon, DiscountTag01Icon, Calendar03Icon];

export function ComparisonCategorySlider({ items }: { items: CategoryItem[] }) {
  return (
    <div className="md:hidden">
      <div className="grid grid-cols-2 gap-4">
        {items.map((item, index) => {
          const icon = categoryIcons[index % categoryIcons.length];
          const className = [
            "panel group flex min-h-[136px] flex-col items-center justify-center gap-2 px-2 py-5 text-center transition duration-200",
            item.href
              ? "hover:-translate-y-1 hover:border-[var(--primary)] hover:bg-[var(--primary-softer)] active:scale-[0.99]"
              : "cursor-default opacity-90",
          ].join(" ");

          const content = (
            <>
              <HugeIcon icon={icon} className="text-[var(--primary)] transition duration-200 group-hover:scale-110" size={36} aria-hidden />
              <span className="text-[13px] font-black leading-tight">{item.category}</span>
            </>
          );

          return item.href ? (
            <Link
              key={item.category}
              href={item.href}
              className={className}
            >
              {content}
            </Link>
          ) : (
            <div key={item.category} className={className}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
