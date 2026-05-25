import { TripStatus } from '@prisma/client';

/** Allowed trip status transitions (state machine). */
export const TRIP_STATUS_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  [TripStatus.SCHEDULED]: [TripStatus.IN_PROGRESS, TripStatus.CANCELLED],
  [TripStatus.IN_PROGRESS]: [TripStatus.COMPLETED, TripStatus.CANCELLED],
  [TripStatus.COMPLETED]: [],
  [TripStatus.CANCELLED]: [],
};

export function canTransition(from: TripStatus, to: TripStatus): boolean {
  return TRIP_STATUS_TRANSITIONS[from].includes(to);
}

export const TERMINAL_TRIP_STATUSES: TripStatus[] = [
  TripStatus.COMPLETED,
  TripStatus.CANCELLED,
];
