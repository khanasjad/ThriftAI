/**
 * Centralized Anthropic Client with Workspace ID Support
 *
 * This module provides a configured Anthropic client that automatically
 * handles workspace-scoped API keys (sk-ant-usr-*) by adding the required
 * anthropic-workspace-id header.
 *
 * Usage:
 *   import { anthropicClient } from '@/lib/anthropic-client';
 *   const response = await anthropicClient.messages.create({ ... });
 */

import Anthropic from '@anthropic-ai/sdk';

// Get API key and workspace ID from environment
const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '';
const workspaceId = process.env.ANTHROPIC_WORKSPACE_ID || '';

/**
 * Configured Anthropic client with automatic workspace ID header support
 */
export const anthropicClient = new Anthropic({
  apiKey,
  // Add workspace ID header if using user-scoped key (sk-ant-usr-*)
  ...(apiKey.startsWith('sk-ant-usr-') && workspaceId ? {
    defaultHeaders: {
      'anthropic-workspace-id': workspaceId,
    },
  } : {}),
});

/**
 * Check if Anthropic API is properly configured
 */
export function isAnthropicConfigured(): boolean {
  if (!apiKey) {
    return false;
  }

  // If using user-scoped key, workspace ID is required
  if (apiKey.startsWith('sk-ant-usr-') && !workspaceId) {
    console.warn(
      'Anthropic API key is user-scoped (sk-ant-usr-*) but ANTHROPIC_WORKSPACE_ID is not set. ' +
      'API calls may fail. Either set ANTHROPIC_WORKSPACE_ID or use a project-scoped API key.'
    );
    return false;
  }

  return true;
}

/**
 * Get the workspace ID (if configured)
 */
export function getWorkspaceId(): string | undefined {
  return workspaceId || undefined;
}

export default anthropicClient;
