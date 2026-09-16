import { useId, type ClipboardEvent, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, className = '', ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  // Password fields must not be copyable to the clipboard.
  const isPassword = props.type === 'password';
  const blockClipboard = (event: ClipboardEvent<HTMLInputElement>) => event.preventDefault();

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={[
          'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 shadow-sm',
          'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
            : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-200',
          className,
        ].join(' ')}
        {...(isPassword ? { onCopy: blockClipboard, onCut: blockClipboard } : {})}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
