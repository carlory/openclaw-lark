/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Command authorization utilities for the Lark/Feishu channel plugin.
 *
 * Copied from openclaw/plugin-sdk since these functions are not exported
 * from any plugin-sdk subpath.
 */

import type { ClawdbotConfig } from 'openclaw/plugin-sdk';

export type ResolveSenderCommandAuthorizationParams = {
  cfg: ClawdbotConfig;
  rawBody: string;
  isGroup: boolean;
  dmPolicy: string;
  configuredAllowFrom: string[];
  configuredGroupAllowFrom?: string[];
  senderId: string;
  isSenderAllowed: (senderId: string, allowFrom: string[]) => boolean;
  readAllowFromStore: () => Promise<string[]>;
  shouldComputeCommandAuthorized: (rawBody: string, cfg: ClawdbotConfig) => boolean;
  resolveCommandAuthorizedFromAuthorizers: (params: {
    useAccessGroups: boolean;
    authorizers: Array<{ configured: boolean; allowed: boolean }>;
  }) => boolean;
};

/** Compute effective allowlists and command authorization for one inbound sender. */
export async function resolveSenderCommandAuthorization(
  params: ResolveSenderCommandAuthorizationParams,
): Promise<{
  shouldComputeAuth: boolean;
  effectiveAllowFrom: string[];
  effectiveGroupAllowFrom: string[];
  senderAllowedForCommands: boolean;
  commandAuthorized: boolean | undefined;
}> {
  const shouldComputeAuth = params.shouldComputeCommandAuthorized(params.rawBody, params.cfg);
  const storeAllowFrom =
    !params.isGroup &&
    params.dmPolicy !== 'allowlist' &&
    (params.dmPolicy !== 'open' || shouldComputeAuth)
      ? await params.readAllowFromStore().catch(() => [])
      : [];

  // Merge configured and store allowlists
  const effectiveAllowFrom = [...params.configuredAllowFrom, ...storeAllowFrom];
  const effectiveGroupAllowFrom = params.configuredGroupAllowFrom ?? [];

  const useAccessGroups = params.cfg.commands?.useAccessGroups !== false;
  const senderAllowedForCommands = params.isSenderAllowed(
    params.senderId,
    params.isGroup ? effectiveGroupAllowFrom : effectiveAllowFrom,
  );
  const ownerAllowedForCommands = params.isSenderAllowed(params.senderId, effectiveAllowFrom);
  const groupAllowedForCommands = params.isSenderAllowed(params.senderId, effectiveGroupAllowFrom);

  const commandAuthorized = shouldComputeAuth
    ? params.resolveCommandAuthorizedFromAuthorizers({
        useAccessGroups,
        authorizers: [
          { configured: true, allowed: senderAllowedForCommands },
          { configured: true, allowed: ownerAllowedForCommands },
          { configured: params.isGroup, allowed: groupAllowedForCommands },
        ],
      })
    : undefined;

  return {
    shouldComputeAuth,
    effectiveAllowFrom,
    effectiveGroupAllowFrom,
    senderAllowedForCommands,
    commandAuthorized,
  };
}
