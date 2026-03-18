/**
 * Copyright (c) 2026 ByteDance Ltd. and/or its affiliates
 * SPDX-License-Identifier: MIT
 *
 * Temp path utilities for the Lark/Feishu channel plugin.
 *
 * Copied from openclaw/plugin-sdk/temp-path since buildRandomTempFilePath
 * is not exported from any plugin-sdk subpath.
 */

import crypto from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

function sanitizePrefix(prefix: string): string {
  const normalized = prefix.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return normalized || 'tmp';
}

function sanitizeExtension(extension?: string): string {
  if (!extension) {
    return '';
  }
  const normalized = extension.startsWith('.') ? extension : `.${extension}`;
  const suffix = normalized.match(/[a-zA-Z0-9._-]+$/)?.[0] ?? '';
  const token = suffix.replace(/^[._-]+/, '');
  if (!token) {
    return '';
  }
  return `.${token}`;
}

function resolveTempRoot(tmpDir?: string): string {
  return tmpDir ?? os.tmpdir();
}

/** Build a unique temp file path with sanitized prefix/extension parts. */
export function buildRandomTempFilePath(params: {
  prefix: string;
  extension?: string;
  tmpDir?: string;
  now?: number;
  uuid?: string;
}): string {
  const prefix = sanitizePrefix(params.prefix);
  const extension = sanitizeExtension(params.extension);
  const nowCandidate = params.now;
  const now =
    typeof nowCandidate === 'number' && Number.isFinite(nowCandidate)
      ? Math.trunc(nowCandidate)
      : Date.now();
  const uuid = params.uuid?.trim() || crypto.randomUUID();
  return path.join(resolveTempRoot(params.tmpDir), `${prefix}-${now}-${uuid}${extension}`);
}
