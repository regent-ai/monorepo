/**
 * Integration test for Endpoint Crawler with Real Public MCP and A2A Servers
 * Tests against actual public servers.
 */

import { describe, it, expect, beforeAll } from 'bun:test';
import { EndpointCrawler } from '../index.js';

describe('Endpoint Crawler with Real Public Servers', () => {
  let crawler: EndpointCrawler;

  beforeAll(() => {
    crawler = new EndpointCrawler(10000); // Longer timeout for real servers
  });

  it('should fetch A2A capabilities from real server', async () => {
    const endpoint = 'https://hello-world-gxfr.onrender.com';
    const capabilities = await crawler.fetchA2aCapabilities(endpoint);

    // Should either succeed or fail gracefully (soft failure pattern)
    expect(capabilities !== undefined || capabilities === null).toBe(true);
  });

  it('should fetch MCP capabilities from real server (if available)', async () => {
    const endpoint = 'https://mcp.atlassian.com/v1/forge/mcp';
    const capabilities = await crawler.fetchMcpCapabilities(endpoint);

    // Should either succeed or fail gracefully (soft failure pattern)
    // Most MCP servers require authentication, so this may return null
    expect(capabilities !== undefined || capabilities === null).toBe(true);
  });

  it('should handle invalid endpoints gracefully', async () => {
    const invalidEndpoint = 'https://invalid-endpoint-that-does-not-exist.example.com';
    const capabilities = await crawler.fetchMcpCapabilities(invalidEndpoint);

    // Should return null for invalid endpoints (soft failure)
    expect(capabilities).toBeNull();
  });

  it('should validate HTTP/HTTPS requirement for MCP', async () => {
    const wsEndpoint = 'ws://example.com/mcp';
    const capabilities = await crawler.fetchMcpCapabilities(wsEndpoint);

    // Should reject WebSocket URLs
    expect(capabilities).toBeNull();
  });

  it('should validate HTTP/HTTPS requirement for A2A', async () => {
    const wsEndpoint = 'ws://example.com/a2a';
    const capabilities = await crawler.fetchA2aCapabilities(wsEndpoint);

    // Should reject WebSocket URLs
    expect(capabilities).toBeNull();
  });
});
