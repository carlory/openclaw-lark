/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Allowlist utilities for the Lark/Feishu channel plugin.
 *
 * Copied from openclaw/plugin-sdk/allow-from since only some functions
 * are exported from the feishu subpath.
 */

/** Lowercase and optionally strip prefixes from allowlist entries before sender comparisons. */
export function formatAllowFromLowercase(params: {
  allowFrom: Array<string | number>;
  stripPrefixRe?: RegExp;
}): string[] {
  return params.allowFrom
    .map((entry) => String(entry).trim())
    .filter(Boolean)
    .map((entry) => (params.stripPrefixRe ? entry.replace(params.stripPrefixRe, '') : entry))
    .map((entry) => entry.toLowerCase());
}

/** Check whether a sender id matches a simple normalized allowlist with wildcard support. */
export function isNormalizedSenderAllowed(params: {
  senderId: string | number;
  allowFrom: Array<string | number>;
  stripPrefixRe?: RegExp;
}): boolean {
  const normalizedAllow = formatAllowFromLowercase({
    allowFrom: params.allowFrom,
    stripPrefixRe: params.stripPrefixRe,
  });
  if (normalizedAllow.length === 0) {
    return false;
  }
  if (normalizedAllow.includes('*')) {
    return true;
  }
  const sender = String(params.senderId).trim().toLowerCase();
  return normalizedAllow.includes(sender);
}
