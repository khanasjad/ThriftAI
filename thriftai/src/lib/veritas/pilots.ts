/** Pilot application workflow states (PilotApplication.status). */
export const PILOT_STATUSES = ['pending', 'contacted', 'approved', 'converted', 'rejected'] as const
export type PilotStatus = (typeof PILOT_STATUSES)[number]
