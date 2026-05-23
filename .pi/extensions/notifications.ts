import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("session_shutdown", async (_event, ctx) => {
    if (!process.env["NTFY_TOPIC"]) return;
    const topic = process.env["NTFY_TOPIC"];

    try {
      await fetch(`https://ntfy.sh/${topic}`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "pi done",
        signal: ctx.signal,
      });
    } catch (err) {
      // best-effort notification — log for debugging, don't throw
      console.error("pi notification failed:", err);
    }
  });
}
