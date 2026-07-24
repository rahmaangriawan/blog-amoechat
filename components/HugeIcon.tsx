import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import type { SVGProps } from "react";

type HugeIconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  icon: IconSvgElement;
  size?: number | string;
  strokeWidth?: number;
};

export function HugeIcon({ icon, size = 20, strokeWidth = 1.8, ...props }: HugeIconProps) {
  const actualIcon = (icon as any)?.default || icon;

  if (!actualIcon || !Array.isArray(actualIcon)) {
    return null;
  }

  return (
    <HugeiconsIcon
      icon={actualIcon}
      size={size}
      strokeWidth={strokeWidth}
      color="currentColor"
      {...props}
    />
  );
}
