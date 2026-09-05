// Both Discord and Slack accept a simple { content/text: "..." } POST body
// to a webhook URL - no SDK needed, no new account required beyond
// creating a webhook in a server/channel the user already has.
export async function notifyWebhook(webhookUrl: string | undefined, message: string) {
  if (!webhookUrl) return;
  try {
    const isSlack = webhookUrl.includes("hooks.slack.com");
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isSlack ? { text: message } : { content: message }),
    });
  } catch (err) {
    console.error("Webhook notify failed", err);
  }
}
