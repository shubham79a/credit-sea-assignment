'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FileDropzone } from '@/components/portal/FileDropzone';
import { StepHeader } from '@/components/portal/StepHeader';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { useApplication } from '@/hooks/useApplication';
import { ApiError } from '@/lib/api';
import { uploadSalarySlip } from '@/lib/applications';
import { formatDate } from '@/lib/format';
import { formatBytes, validateSalarySlip } from '@/lib/upload';
import type { Application, SalarySlip } from '@/types';

export default function SalarySlipPage() {
  const { application, loading, error, refetch } = useApplication();

  return (
    <section className="space-y-8">
      <StepHeader
        step={2}
        title="Salary slip"
        description="Upload your latest salary slip so we can verify your income."
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        </div>
      ) : error ? (
        <Alert tone="error">{error}</Alert>
      ) : !application || !application.bre.passed ? (
        <EligibilityGate />
      ) : (
        <SalarySlipStep application={application} onUploaded={refetch} />
      )}
    </section>
  );
}

/** Shown when step 1 hasn't been completed (or the BRE failed). */
function EligibilityGate() {
  return (
    <Alert tone="warning">
      <p className="font-medium">Complete your personal details first.</p>
      <p className="mt-1">
        The salary slip can be uploaded once your eligibility check has passed.{' '}
        <Link href="/portal/personal-details" className="font-medium underline">
          Go to step 1
        </Link>
      </p>
    </Alert>
  );
}

function SalarySlipStep({
  application,
  onUploaded,
}: {
  application: Application;
  onUploaded: () => Promise<void>;
}) {
  const router = useRouter();
  const existing = application.salarySlip ?? null;

  const [replacing, setReplacing] = useState(existing === null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleFileChange(next: File | null) {
    setError(null);
    setFile(next);
    // Client-side mirror of the server rules — instant feedback, no request.
    setFileError(next ? validateSalarySlip(next) : null);
  }

  async function handleUpload() {
    if (!file || fileError) return;
    setUploading(true);
    setError(null);
    try {
      await uploadSalarySlip(file);
      await onUploaded();
      router.push('/portal/loan');
    } catch (err) {
      // ApiError from our API (sign/link) or a plain Error from the Cloudinary step.
      setError(
        err instanceof ApiError || err instanceof Error
          ? err.message
          : 'Upload failed. Check your connection and try again.',
      );
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        {error && <Alert tone="error">{error}</Alert>}

        {existing && !replacing ? (
          <ExistingSlipCard
            slip={existing}
            onReplace={() => setReplacing(true)}
            onContinue={() => router.push('/portal/loan')}
          />
        ) : (
          <>
            {existing && (
              <p className="text-sm text-slate-500">
                Choosing a new file will replace{' '}
                <span className="font-medium text-slate-700">{existing.originalName}</span>.
              </p>
            )}
            <FileDropzone
              file={file}
              onFileChange={handleFileChange}
              error={fileError}
              disabled={uploading}
            />
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              {existing && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setReplacing(false);
                    handleFileChange(null);
                  }}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              )}
              <Button onClick={handleUpload} loading={uploading} disabled={!file || Boolean(fileError)}>
                {existing ? 'Replace & continue' : 'Upload & continue'}
              </Button>
            </div>
          </>
        )}
      </div>

      <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm">
        <h2 className="font-semibold">What to upload</h2>
        <ul className="mt-3 space-y-2 text-slate-600">
          <li>Your most recent monthly salary slip</li>
          <li>PDF, JPG or PNG format</li>
          <li>Maximum file size 5 MB</li>
          <li>Name, employer and net pay should be readable</li>
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Your document is only used to verify the income you declared in step 1.
        </p>
      </aside>
    </div>
  );
}

function ExistingSlipCard({
  slip,
  onReplace,
  onContinue,
}: {
  slip: SalarySlip;
  onReplace: () => void;
  onContinue: () => void;
}) {
  const isImage = slip.mimeType.startsWith('image/');

  return (
    <div className="space-y-5">
      <Alert tone="success">Salary slip uploaded. You can continue to loan configuration.</Alert>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-2xl">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- Cloudinary URL, not optimised by Next
            <img src={slip.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden>📄</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-slate-800">{slip.originalName}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatBytes(slip.size)} · uploaded {formatDate(slip.uploadedAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={slip.url} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm">
              View
            </Button>
          </a>
          <Button variant="ghost" size="sm" onClick={onReplace}>
            Replace
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onContinue}>Continue to loan configuration</Button>
      </div>
    </div>
  );
}
