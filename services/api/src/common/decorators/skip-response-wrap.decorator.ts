import { SetMetadata } from '@nestjs/common';

export const SKIP_RESPONSE_WRAP_KEY = 'skipResponseWrap';

/** Return handler payload as-is (no `{ success, data, meta }` envelope). */
export const SkipResponseWrap = () => SetMetadata(SKIP_RESPONSE_WRAP_KEY, true);
