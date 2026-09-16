'use client';

import { useId } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** How to render the current value (e.g. currency). */
  format?: (value: number) => string;
  /** Captions under the track ends; default to formatted min/max. */
  minLabel?: string;
  maxLabel?: string;
  /** Unit shown after the numeric input, e.g. "days". */
  unit?: string;
  disabled?: boolean;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Range input paired with a numeric input so the user can drag for feel or
 * type for precision. Both stay in sync; typed values are clamped to range.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v) => String(v),
  minLabel,
  maxLabel,
  unit,
  disabled = false,
}: SliderProps) {
  const id = useId();
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium text-slate-700">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            aria-label={`${label} (exact value)`}
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (!Number.isNaN(next)) onChange(clamp(next, min, max));
            }}
            onBlur={(e) => {
              // Snap typed values onto the step grid so slider & input agree.
              const next = Number(e.target.value);
              if (!Number.isNaN(next)) onChange(clamp(Math.round(next / step) * step, min, max));
            }}
            className="w-32 rounded-lg border border-slate-300 px-2.5 py-1.5 text-right text-sm font-semibold tabular-nums text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          {unit && <span className="text-sm text-slate-500">{unit}</span>}
        </div>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={format(value)}
        style={{
          background: `linear-gradient(to right, rgb(79 70 229) ${percent}%, rgb(226 232 240) ${percent}%)`,
        }}
        className="h-2 w-full cursor-pointer appearance-none rounded-full accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:ring-2 [&::-webkit-slider-thumb]:ring-indigo-600 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-indigo-600 [&::-moz-range-thumb]:bg-white"
      />

      <div className="flex justify-between text-xs text-slate-500">
        <span>{minLabel ?? format(min)}</span>
        <span>{maxLabel ?? format(max)}</span>
      </div>
    </div>
  );
}
