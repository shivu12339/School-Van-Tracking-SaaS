import { describe, expect, it } from 'vitest';
import { queryKeys } from './query-keys';

describe('queryKeys', () => {
  it('builds stable fleet driver keys', () => {
    expect(queryKeys.fleet.drivers(1, 'abc')).toEqual(['drivers', 1, 'abc']);
  });

  it('builds tracking live key with trip id', () => {
    expect(queryKeys.tracking.live('trip-1')).toEqual(['tracking', 'live', 'trip-1']);
  });
});
