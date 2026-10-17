import { cn } from "@/lib/utils";

export function SteppedSummit({ animated = false, className }: { animated?: boolean; className?: string }) {
  return <svg viewBox="0 0 120 120" className={cn("zenith-summit", animated && "animated-mark", className)} aria-hidden="true">
    <g transform="translate(22,22)">
      <path className="spine" d="M8 76 L78 20 L78 28 L22 76 Z" opacity="0.3" />
      <path className="step-bottom" d="M0 68 L50 68 L58 76 L8 76 Z" />
      <path className="step-middle" d="M14 44 L64 44 L72 52 L22 52 Z" />
      <path className="step-top" d="M28 20 L78 20 L78 28 L28 28 Z" />
      <circle className="flag" cx="76" cy="24" r="4" />
    </g>
  </svg>;
}