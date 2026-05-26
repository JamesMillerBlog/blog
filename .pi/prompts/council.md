Execute the following council of agents run NOW. Do not ask for confirmation. Do not summarize these instructions — just follow them step by step.

## Step 1: Run the Council via agent_team

Call agent_team with action "start" and the graph below. The question/task is at the bottom of this prompt under "Question / Task".

```json
{
  "objective": "Council of agents: multi-model collaborative answer to the question/task",
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
      "task": "Read the question/task at the end of your context. Map exactly what is being asked. Identify sub-questions, relevant context, and what specialist angles would produce the most complete answer. Return a structured breakdown of: (1) core question, (2) key sub-questions, (3) recommended angles for analyst and critic."
    },
    {
      "id": "analyst",
      "agent": { "ref": "project:council-analyst" },
      "needs": ["scout"],
      "task": "Read the scout's breakdown and the original question. Provide deep analytical thinking: technical depth, logical structure, key insights, and concrete recommendations."
    },
    {
      "id": "critic",
      "agent": { "ref": "project:council-critic" },
      "needs": ["scout"],
      "task": "Read the scout's breakdown and the original question. Challenge the obvious answers: what are the risks, failure modes, unstated assumptions, and second-order effects?"
    },
    {
      "id": "synthesizer",
      "agent": { "ref": "project:council-synthesizer" },
      "after": ["analyst", "critic"],
      "task": "Read the scout breakdown, analyst output, and critic output. Synthesize into a final answer to the original question. Weigh competing perspectives. Produce a clear, actionable response."
    }
  ],
  "limits": {
    "concurrency": 4,
    "timeoutSecondsPerStep": 600
  }
}
```

## Step 2: Monitor and collect results

Use run_status with waitSeconds to wait for all steps to complete. Then use step_result to retrieve the synthesizer's output.

## Step 3: Present the council answer

Output the synthesizer's final answer. If the synthesizer did not run (due to upstream failures), summarise what partial results exist and explain what failed.

---

## Question / Task
