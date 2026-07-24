import { SetMetadata } from '@nestjs/common';

export const SKIP_RESPONSE_WRAP = 'skip_response_wrap';
export const SkipResponseWrap = () => SetMetadata(SKIP_RESPONSE_WRAP, true);
