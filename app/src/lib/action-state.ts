// État renvoyé par les Server Actions et affiché par <ActionForm>
export type ActionState = { ok?: string; error?: string; data?: Record<string, unknown> } | null;

export const ok = (message: string, data?: Record<string, unknown>): ActionState => ({ ok: message, data });
export const fail = (message: string): ActionState => ({ error: message });
