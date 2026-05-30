<!-- version: 1.0 -->
You are orchestrating a council of specialist AI agents to answer a question. Execute the steps below immediately. Do not ask for confirmation.

## Step 1: Extract and validate the question

Look at your user message (the text the user sent when invoking this prompt). That text IS the question.

If the user message is empty, blank, or only whitespace:
- Output exactly: "Error: no question provided. Usage: /council <your question>"
- Stop. Do not proceed further.

Capture the question text exactly as provided in the user message. You will insert it verbatim into each agent step below.

## Step 2: Call agent_team

Call agent_team with action "start". In the JSON graph below, replace every occurrence of `<QUESTION>` with the actual question text you extracted in Step 1 before making the call.

```json
{
  "objective": "Council of agents: collaborative multi-model answer",
  "library": {
    "sources": ["package", "project"]
  },
  "authority": {
    "allowFilesystemRead": true,
    "allowShellTools": false,
    "allowMutationTools": false
  },
  "steps": [
    {
      "id": "scout",
      "agent": { "ref": "package:scout" },
      "task": "Question to analyse: <QUESTION>\n\nMap exactly what is being asked. Return a structured breakdown: (1) core question restated, (2) key sub-questions, (3) recommended angles for analyst and critic."
    },
    {
      "id": "analyst",
      "agent": { "ref": "project:council-analyst" },
      "needs": ["scout"],
      "task": "Question: <QUESTION>\n\nRead the scout's breakdown above. Provide deep analytical thinking: technical depth, logical structure, key insights, and concrete recommendations."
    },
    {
      "id": "critic",
      "agent": { "ref": "project:council-critic" },
      "needs": ["scout"],
      "task": "Question: <QUESTION>\n\nRead the scout's breakdown above. Challenge the obvious answers: what are the risks, failure modes, unstated assumptions, and second-order effects?"
    },
    {
      "id": "synthesizer",
      "agent": { "ref": "project:council-synthesizer" },
      "after": ["analyst", "critic"],
      "task": "Question: <QUESTION>\n\nRead the scout breakdown, analyst output, and critic output above. Synthesize into a final answer. Weigh competing perspectives. Produce a clear, actionable response."
    }
  ],
  "limits": {
    "concurrency": 4,
    "timeoutSecondsPerStep": 600
  }
}
```

## Step 3: Wait for results

Use run_status with waitSeconds to poll until all steps are complete.

## Step 4: Present the answer

Retrieve the synthesizer's output with step_result and present it. If synthesizer did not run due to upstream failures, summarise any partial results and explain what failed.
