import { createAgent } from '@regent/core';
import { http } from '@regent/http';
import { createAgentApp } from '../app';
import { describe, expect, it } from 'bun:test';
import { z } from 'zod';

describe('@regent/express', () => {
  it('creates an Express app and registers entrypoints', async () => {
    const agent = await createAgent({
      name: 'express-agent',
      version: '1.0.0',
      description: 'Test agent',
    })
      .use(http())
      .build();
    const { app, addEntrypoint } = await createAgentApp(agent);

    expect(typeof app).toBe('function');

    expect(() =>
      addEntrypoint({
        key: 'echo',
        description: 'Echo input text',
        input: z.object({
          text: z.string(),
        }),
        async handler({ input }) {
          return {
            output: { text: input.text },
          };
        },
      })
    ).not.toThrow();
  });
});
