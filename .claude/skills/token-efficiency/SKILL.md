---
name: token-efficiency
description: Token optimization best practices for cost-effective Claude Code usage. Automatically applies efficient file reading, command execution, and output handling strategies. Includes model selection guidance (Opus for learning, Sonnet for development/debugging). Prefers bash commands over reading files.
version: 1.5.0
allowed-tools: Read, Grep, Glob, Bash
---

# Token Efficiency Expert

This skill provides token optimization strategies for cost-effective Claude Code usage across all projects. These guidelines help minimize token consumption while maintaining high-quality assistance.

## Core Principle

**ALWAYS follow these optimization guidelines by default unless the user explicitly requests verbose output or full file contents.**

Default assumption: **Users prefer efficient, cost-effective assistance.**

## Model Selection Strategy

Use the right model for the task to optimize cost and performance:

- Opus: learning new codebases, architecture understanding, deep analysis.
- Sonnet (default): writing code, implementation, debugging, tests, docs, deployment.

Typical session pattern:
1. Start with Opus for initial understanding.
2. Switch to Sonnet for routine implementation.
3. Return to Opus only when deep analysis is needed.

## Token Optimization Rules

1. Use quiet/minimal output modes (`--quiet`, `-q`, `--silent`) when possible.
2. Never read entire large logs; filter first.
3. Check lightweight sources first (`git status --short`, manifests, config files).
4. Use Grep for targeted search instead of full-file reads.
5. Read files with offset/limit when partial context is enough.
6. Prefer command-based file operations for bulk data operations.
7. Filter command output before returning it.
8. Summarize key findings instead of dumping raw output.
9. For large outputs, sample with head/tail patterns.
10. Use targeted extraction for JSON/CSV.
11. Read code strategically (overview → targeted sections).

## Override Conditions

Override efficiency mode when:

- User explicitly asks for full output.
- Filtered output is insufficient for accurate diagnosis.
- File is known to be small.
- Deep learning/architecture exploration is the current goal.

## Summary

Core motto: **Right model. Right tool. Filter first. Read selectively. Summarize intelligently.**
