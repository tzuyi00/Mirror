import { openapi } from '@/lib/openapi-source';
import { createAPIPage } from 'fumadocs-openapi/ui';

// Create API Page component using the openapi-source
export const APIPage = createAPIPage(openapi);
