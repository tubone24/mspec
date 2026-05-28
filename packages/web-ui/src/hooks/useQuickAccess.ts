// @mspec-delta 2026-05-27-110858-markdown-search-and-quick-access/specs/quick-access-palette/spec.md
// Requirements implemented: FR-001, FR-002
// Change: markdown-search-and-quick-access

import { useState, useEffect, useCallback } from 'react';

function getIsMac(): boolean {
  // FR-002: UA文字列はクライアントのキーバインド判定のみに使用（サーバー送信しない）
  if (typeof navigator === 'undefined') return false;
  const platform = navigator.userAgentData?.platform ?? navigator.platform ?? '';
  return /mac/i.test(platform);
}

const isMac = getIsMac();

export function useQuickAccess(): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  isMac: boolean;
} {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && (isMac ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return { isOpen, open, close, isMac };
}
