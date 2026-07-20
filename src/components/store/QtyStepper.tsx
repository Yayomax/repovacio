"use client";

export function QtyStepper({
  value,
  min = 1,
  max,
  onChange,
  small = false,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  small?: boolean;
}) {
  const buttonClass = `press grid place-items-center rounded-lg border border-white/15 text-white transition-colors duration-150 hover:border-white/40 disabled:pointer-events-none disabled:opacity-40 ${
    small ? "h-7 w-7 text-sm" : "h-9 w-9"
  }`;

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-label="Restar uno"
        className={buttonClass}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span
        className={`min-w-7 text-center font-semibold tabular-nums ${small ? "text-sm" : ""}`}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Sumar uno"
        className={buttonClass}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
