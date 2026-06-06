import SpecOptimizerClient from "./SpecOptimizerClient";

export const metadata = {
  title: "Spec Optimizer | Secure Easy Admin",
  description: "Retroactively apply learned specifications to existing products.",
};

export default function SpecOptimizerPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <SpecOptimizerClient />
    </div>
  );
}
