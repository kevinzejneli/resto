"use client";

import { createApiClient } from "@resto/api-client";

// Same-origin from the browser.
export const api = createApiClient({ baseUrl: "" });
