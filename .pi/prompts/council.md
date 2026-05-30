<!-- version: 1.0 -->
You are orchestrating a council of specialist AI agents to answer a question. Execute the steps below immediately. Do not ask for confirmation.

The question has already been embedded verbatim in each agent task below. Do not try to extract it from context — just call agent_team now.

## Step 1: Call agent_team

Call agent_team with action "start" using the JSON graph below. The question is already substituted into each task.

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

## Step 2: Wait for results

Use run_status with waitSeconds to poll until all steps are complete.

## Step 3: Present the answer

Retrieve the synthesizer's output with step_result and present it. If synthesizer did not run due to upstream failures, summarise any partial results and explain what failed.
