"use client";

import { useActionState, type ReactNode } from "react";
import type { ActionState } from "@/lib/action-state";
import { Button, type ButtonVariant } from "./ui";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: ReactNode;
  pendingLabel?: string;
  variant?: ButtonVariant;
  confirm?: string;
  className?: string;
  children?: ReactNode;
};

// Formulaire branché sur une Server Action, avec état de chargement et message
export function ActionForm({ action, submitLabel, pendingLabel = "En cours…", variant = "primary", confirm, className = "space-y-3", children }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant={variant} disabled={pending}>
          {pending ? pendingLabel : submitLabel}
        </Button>
        {state?.error && <p className="text-sm text-pen" role="alert">{state.error}</p>}
        {state?.ok && <p className="text-sm text-sage" role="status">{state.ok}</p>}
      </div>
    </form>
  );
}
