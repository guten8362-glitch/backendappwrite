import { Check, X } from "lucide-react";
import { getApprovalWorkflow, type BookingStage } from "@/lib/booking-store";
import { cn } from "@/lib/utils";

export function Timeline({ 
  stage, 
  institution, 
  singlePrincipalOnly = false 
}: { 
  stage: BookingStage | string; 
  institution?: string;
  singlePrincipalOnly?: boolean;
}) {
  if (singlePrincipalOnly) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 p-3 border border-emerald-200/60 dark:border-emerald-800/40">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-600 text-white shadow-xs">
          <Check className="size-4" />
        </span>
        <div className="flex flex-col">
          <span className="text-[0.9rem] font-bold text-emerald-900 dark:text-emerald-300">
            MVIT Principal Approval
          </span>
          <span className="text-[0.78rem] text-emerald-700/90 dark:text-emerald-400 font-medium">
            Mr. Malarkanan (MVIT Principal)
          </span>
        </div>
      </div>
    );
  }

  const workflow = getApprovalWorkflow(institution || "MVIT");
  const isRejected = stage === "rejected";
  const isConfirmed = stage === "confirmed";

  // Find index of current stage in workflow
  const currentIdx = workflow.findIndex((step) => step.key === stage);

  if (isRejected) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/50 p-4 text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-red-600 text-white">
          <X className="size-4" />
        </span>
        <div>
          <p className="text-[0.9rem] font-semibold">Request Declined / Rejected</p>
          <p className="text-[0.8rem] opacity-80">This booking request was declined during the approval workflow.</p>
        </div>
      </div>
    );
  }

  return (
    <ol className="relative ml-1 space-y-4">
      {workflow.map((s, i) => {
        const done = isConfirmed || (currentIdx !== -1 && i < currentIdx);
        const active = !isConfirmed && (i === currentIdx || (currentIdx === -1 && i === 0));

        return (
          <li key={s.key} className="relative flex gap-4 pb-2 last:pb-0">
            {i < workflow.length - 1 && (
              <span
                className={cn(
                  "absolute left-[11px] top-6 h-full w-px transition-colors duration-500",
                  done ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border transition-all duration-500",
                done && "border-primary bg-primary text-primary-foreground",
                active && "border-primary bg-primary-soft text-primary shadow-xs",
                !done && !active && "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="size-3.5" />
              ) : (
                <span
                  className={cn(
                    "size-2 rounded-full",
                    active ? "halo bg-primary" : "bg-border",
                  )}
                />
              )}
            </span>
            <div className="flex flex-col">
              <span
                className={cn(
                  "text-[0.88rem] transition-colors",
                  done && "text-foreground font-medium",
                  active && "font-bold text-primary",
                  !done && !active && "text-muted-foreground/70",
                )}
              >
                {s.label}
              </span>
              <span className="text-[0.75rem] text-muted-foreground">
                {s.approver}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
