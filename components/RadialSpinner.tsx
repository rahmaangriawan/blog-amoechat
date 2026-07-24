type RadialSpinnerProps = {
  size?: number;
  className?: string;
  title?: string;
};

/**
 * Animated radial dot spinner (8 dots rotating around a circle).
 * Pakai <animate> SMIL asli — animasi selalu jalan tanpa JS.
 */
export function RadialSpinner({ size = 24, className, title }: RadialSpinnerProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {Array.from({ length: 8 }).map((_, index) => (
        <circle
          key={index}
          cx="12"
          cy="2"
          r="0"
          fill="currentColor"
          transform={index === 0 ? undefined : `rotate(${index * 45} 12 12)`}
        >
          <animate
            attributeName="r"
            begin={`${index * 0.125}s`}
            calcMode="spline"
            dur="1s"
            keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
            repeatCount="indefinite"
            values="0;2;0;0"
          />
        </circle>
      ))}
    </svg>
  );
}
