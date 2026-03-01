/**
 * Parser for chat-based form actions.
 *
 * When the AI chat wants to modify fields, it includes special tags:
 * [FIELD_UPDATE field_id="xxx" value="..."]
 *
 * This parser extracts those actions from the response text.
 */

export interface ChatFieldAction {
  field_id: string;
  value: string;
}

/**
 * Extract FIELD_UPDATE directives from AI response text.
 */
export function parseChatActions(text: string): ChatFieldAction[] {
  const actions: ChatFieldAction[] = [];
  const regex = /\[FIELD_UPDATE\s+field_id="([^"]+)"\s+value="([^"]*?)"\]/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    actions.push({
      field_id: match[1],
      value: match[2],
    });
  }

  return actions;
}

/**
 * Remove FIELD_UPDATE directives from text, returning clean display text.
 */
export function stripChatActions(text: string): string {
  return text
    .replace(/\[FIELD_UPDATE\s+field_id="[^"]+"\s+value="[^"]*?"\]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
