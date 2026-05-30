<!-- version: 1.1 -->
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
      "id": "scout-a",
      "agent": { "ref": "project:council-scout" },
      "task": "Question to analyse: <QUESTION>\n\nMap the technical and factual dimensions: (1) restate the core question precisely, (2) identify key sub-questions and hard constraints, (3) note what specific information the analyst will need to reason well."
    },
    {
      "id": "scout-b",
      "agent": { "ref": "project:council-scout" },
      "task": "Question to analyse: <QUESTION>\n\nMap the strategic and contextual dimensions: (1) broader implications and second-order effects the question implies, (2) related considerations not explicitly asked, (3) angles and assumptions the critic should challenge."
    },
    {
      "id": "analyst",
      "agent": { "ref": "project:council-analyst" },
      "needs": ["scout-a", "scout-b"],
      "task": "Question: <QUESTION>\n\nRead both scout breakdowns above. Provide deep analytical thinking: technical depth, logical structure, key insights, and concrete recommendations."
    },
    {
      "id": "critic",
      "agent": { "ref": "project:council-critic" },
      "needs": ["scout-a", "scout-b"],
      "task": "Question: <QUESTION>\n\nRead both scout breakdowns above. Challenge the obvious answers: what are the risks, failure modes, unstated assumptions, and second-order effects?"
    },
    {
      "id": "synthesizer",
      "agent": { "ref": "project:council-synthesizer" },
      "after": ["analyst", "critic"],
      "task": "Question: <QUESTION>\n\nRead both scout breakdowns, the analyst output, and the critic output above. Synthesize into a final answer. Weigh competing perspectives. Produce a clear, actionable response."
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

Retrieve the synthesizer's output with step_result. Then copy the full text of that output verbatim into your response — do not summarise, do not say "the answer was presented", do not confirm completion. Just print the synthesizer's exact output text and nothing else. If synthesizer did not run due to upstream failures, print the critic or analyst output instead and explain what failed.
