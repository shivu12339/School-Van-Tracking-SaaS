import { TripDirection, TripStatus } from '@prisma/client';

export interface TripAnalyticsSummary {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  pickup: number;
  dropoff: number;
  return: number;
}

export function buildTripAnalytics(
  rows: { status: TripStatus; direction: TripDirection; _count: { id: number } }[],
): TripAnalyticsSummary {
  const summary: TripAnalyticsSummary = {
    total: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    pickup: 0,
    dropoff: 0,
    return: 0,
  };

  for (const row of rows) {
    const count = row._count.id;
    summary.total += count;
    if (row.status === TripStatus.SCHEDULED) summary.scheduled += count;
    if (row.status === TripStatus.IN_PROGRESS) summary.inProgress += count;
    if (row.status === TripStatus.COMPLETED) summary.completed += count;
    if (row.status === TripStatus.CANCELLED) summary.cancelled += count;
    if (row.direction === TripDirection.PICKUP) summary.pickup += count;
    if (row.direction === TripDirection.DROPOFF) summary.dropoff += count;
    if (row.direction === TripDirection.RETURN) summary.return += count;
  }

  return summary;
}
