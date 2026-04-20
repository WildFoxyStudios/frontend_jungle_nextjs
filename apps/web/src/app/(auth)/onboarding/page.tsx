import { OnboardingWizard } from "@/components/auth/OnboardingWizard";

export const metadata = {
  title: "Welcome to Jungle",
  description: "Complete your profile to get started",
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <OnboardingWizard />
    </div>
  );
}
