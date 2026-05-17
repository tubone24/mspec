// @mspec-delta 2026-05-14-022259-claude-core-completion/specs/cli-workflow-engine/spec.md
// Requirements implemented: FR-016
// Change: claude-core-completion

import { describe, it, expect } from 'vitest';
import { extractPrinciples } from './constitution-principles.js';

describe('extractPrinciples', () => {
  it('real constitution (5 principles) から全原則を抽出する', () => {
    const src = `# Project Constitution

## Core Principles

### I. ステップ独立性

本文。

### II. 決定論的マージ

本文。

### III. 質問駆動の要件確定

本文。

### IV. 双方向アンカー

本文。

### V. 強制ステップと拡張ステップの分離

本文。
`;
    const result = extractPrinciples(src);
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ id: 'I', name: 'ステップ独立性' });
    expect(result[1]).toEqual({ id: 'II', name: '決定論的マージ' });
    expect(result[2]).toEqual({ id: 'III', name: '質問駆動の要件確定' });
    expect(result[3]).toEqual({ id: 'IV', name: '双方向アンカー' });
    expect(result[4]).toEqual({ id: 'V', name: '強制ステップと拡張ステップの分離' });
  });

  it('フィクスチャ憲法 (2 原則) から { id, name }[] を返す', () => {
    const src = `# Fixture Constitution

### I. Library-First

本文。

### II. CLI Interface

本文。
`;
    const result = extractPrinciples(src);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'I', name: 'Library-First' });
    expect(result[1]).toEqual({ id: 'II', name: 'CLI Interface' });
  });

  it('H3 見出しがない場合は空配列を返す', () => {
    const src = '# Constitution\n\nNo principles here.\n';
    expect(extractPrinciples(src)).toHaveLength(0);
  });

  it('アンカープロトコル行の ### を H3 と誤検出しない', () => {
    const src = `# Constitution

### I. Real Principle

本文。

Not a heading: ### Just some ### inline text
`;
    const result = extractPrinciples(src);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 'I', name: 'Real Principle' });
  });

  it('ローマ数字以外の H3 は無視する', () => {
    const src = `### SomeSection

### I. Valid Principle

### AnotherSection
`;
    const result = extractPrinciples(src);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('I');
  });
});
