'use client';

import { useId, useRef, useState, type DragEvent, type KeyboardEvent } from 'react';
import { ALLOWED_EXTENSIONS, ALLOWED_LABEL, MAX_FILE_SIZE_MB, formatBytes } from '@/lib/upload';

interface FileDropzoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  error?: string | null;
  disabled?: boolean;
}

/**
 * Drag-and-drop file picker with a keyboard-accessible fallback button.
 * Validation is the caller's job — this only reports the chosen file.
 */
export function FileDropzone({ file, onFileChange, error, disabled = false }: FileDropzoneProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;
    const dropped = event.dataTransfer.files?.[0] ?? null;
    onFileChange(dropped);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPicker();
    }
  };

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-describedby={`${inputId}-hint`}
        onClick={openPicker}
        onKeyDown={handleKeyDown}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={[
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
          disabled ? 'cursor-not-allowed opacity-60' : '',
          error
            ? 'border-rose-300 bg-rose-50'
            : dragging
              ? 'border-indigo-400 bg-indigo-50'
              : 'border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/40',
        ].join(' ')}
      >
        <span
          aria-hidden
          className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-sm ring-1 ring-slate-200"
        >
          📄
        </span>

        {file ? (
          <>
            <p className="text-sm font-medium text-slate-800">{file.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {formatBytes(file.size)} · click or drop to choose a different file
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-800">
              <span className="text-indigo-600">Click to browse</span> or drag &amp; drop
            </p>
            <p id={`${inputId}-hint`} className="mt-1 text-xs text-slate-500">
              {ALLOWED_LABEL} · up to {MAX_FILE_SIZE_MB} MB
            </p>
          </>
        )}

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ALLOWED_EXTENSIONS}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
