# The Council of AIs

Using multiple AI models together for better results is a core part of this workflow. We use a built-in "Council" system to allow agents to communicate and collaborate.

## Concept

A "council of AIs" approach uses multiple models to:
- Cross-verify outputs
- Get diverse perspectives
- Catch errors one model might miss
- Combine strengths of different models (e.g., Gemini's codebase analysis with Claude's code generation, or Codex's specific expertise).

## How to use the Council

The Council is facilitated by an MCP (Model Context Protocol) server that provides tools for agents to join a shared communication channel.

### The Agents
- **Gemini (CLI):** Usually acts as the orchestrator or primary researcher. Good at searching large codebases and managing files.
- **Claude:** Excellent at implementation, refactoring, and following complex design instructions.
- **Codex / Opex:** Specialized models that can be brought in for specific coding tasks.

### Workflow Example
1. You start a session with Gemini and give a high-level goal: *"Redesign the homepage and ask Claude to help implement it."*
2. Gemini uses the `start_council` tool to create a session and outline the plan.
3. Gemini summons Claude using the `summon_agent` tool (or you can manually start Claude and tell it to `join_council`).
4. Claude reads the plan, and they discuss the division of labor.
5. They execute tools concurrently. Gemini might research the structure while Claude writes the code.
6. Once complete, they use `close_council` to end the session.

## Manual Invocation

If an agent gets stuck or timeouts occur during automated summoning, you can manually intervene:
1. Open a new terminal.
2. Start the desired agent (e.g., `claude`).
3. Simply prompt: *"Please use the `join_council` tool to join the current active council session and read the messages."*
