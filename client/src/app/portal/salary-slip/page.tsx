import { StepHeader } from '@/components/portal/StepHeader';
import { Alert } from '@/components/ui/Alert';

/** Placeholder — the upload UI lands in the next part. */
export default function SalarySlipPage() {
  return (
    <section className="space-y-8">
      <StepHeader
        step={2}
        title="Salary slip"
        description="Upload your latest salary slip so we can verify your income."
      />
      <Alert tone="success">
        Your eligibility check passed. Document upload is the next step and is coming shortly.
      </Alert>
    </section>
  );
}
