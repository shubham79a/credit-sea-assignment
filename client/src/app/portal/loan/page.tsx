import { StepHeader } from '@/components/portal/StepHeader';
import { Alert } from '@/components/ui/Alert';

/** Placeholder — loan configuration (sliders + live interest panel) lands in the next part. */
export default function LoanConfigPage() {
  return (
    <section className="space-y-8">
      <StepHeader
        step={3}
        title="Loan configuration"
        description="Choose your loan amount and tenure, review the interest, and apply."
      />
      <Alert tone="success">
        Your documents are in. Loan configuration is the next step and is coming shortly.
      </Alert>
    </section>
  );
}
