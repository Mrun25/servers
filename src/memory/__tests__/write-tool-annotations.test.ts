import { describe, it, expect } from 'vitest';
import { server } from '../index.js';

/**
 * Regression tests for the write tools' MCP annotations.
 *
 * create_entities, create_relations and add_observations each rewrite the
 * whole JSONL memory file from the parsed graph (loadGraph -> saveGraph).
 * Anything the current schema does not model is silently dropped on every
 * write: extra fields written by older server versions or other clients,
 * unknown record types, and malformed lines - including content belonging
 * to records the call never touched.
 *
 * The MCP spec reads `destructiveHint: false` as "performs only additive
 * updates", and clients relax confirmation for tools that declare it, so
 * these three tools must not advertise non-destructive behaviour.
 */
describe('write tool annotations', () => {
  const registeredTools = () =>
    (server as any)._registeredTools as Record<
      string,
      { annotations?: Record<string, unknown> }
    >;

  it.each(['create_entities', 'create_relations', 'add_observations'])(
    '%s is annotated destructiveHint: true, since it rewrites the whole store',
    (toolName) => {
      const tools = registeredTools();
      expect(tools[toolName]).toBeDefined();
      expect(tools[toolName].annotations?.destructiveHint).toBe(true);
    },
  );

  it('read-only tools remain annotated non-destructive', () => {
    const tools = registeredTools();
    for (const toolName of ['read_graph', 'search_nodes', 'open_nodes']) {
      expect(tools[toolName]?.annotations?.destructiveHint).toBe(false);
    }
  });
});
