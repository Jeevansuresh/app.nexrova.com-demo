import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "danger" | "blue";
  className?: string;
}

export function Badge({ label, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        variant === "default" && "bg-gray-100 text-gray-600",
        variant === "success" && "bg-green-50 text-green-700",
        variant === "warning" && "bg-amber-50 text-amber-700",
        variant === "danger" && "bg-red-50 text-red-600",
        variant === "blue" && "bg-blue-50 text-blue-700",
        className
      )}
    >
      {label}
    </span>
  );
}

export function InquiryBadge({ type }: { type: string }) {
  if (type === "Booking")
    return <Badge label="Booking" variant="blue" />;
  return <Badge label="General" variant="default" />;
}

export function StageBadge({ stage, escalated }: { stage: string; escalated: number | boolean | string }) {
  const isEsc = escalated === 1 || escalated === true || String(escalated) === "1";
  if (isEsc)
    return <Badge label="Needs Attention" variant="danger" />;
  if (stage === "Booked")
    return <Badge label="Confirmed" variant="success" />;
  return <Badge label="Follow-up" variant="warning" />;
}
