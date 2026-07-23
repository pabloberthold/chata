import type { Conversation } from "../types";

export function exportAsMarkdown(conv: Conversation): string {
  const lines: string[] = [
    `# ${conv.title}`,
    `**Modelo:** ${conv.modelId}`,
    `**Agente:** ${conv.agentId}`,
    `**Fecha:** ${new Date(conv.createdAt).toLocaleString()}`,
    "",
    "---",
    "",
  ];

  for (const msg of conv.messages) {
    const role = msg.role === "user" ? "👤 Usuario" : msg.role === "assistant" ? "🤖 Asistente" : "⚙️ Sistema";
    lines.push(`### ${role}`);
    lines.push("");
    lines.push(msg.content);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  lines.push(`*Exportado el ${new Date().toLocaleString()} - Total de tokens estimados: ${conv.estimatedTokens}*`);
  return lines.join("\n");
}

export function exportAsJson(conv: Conversation): string {
  return JSON.stringify(
    {
      title: conv.title,
      modelId: conv.modelId,
      agentId: conv.agentId,
      createdAt: conv.createdAt,
      messages: conv.messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
      estimatedTokens: conv.estimatedTokens,
    },
    null,
    2
  );
}

export function importFromJson(json: string): Partial<Conversation> | null {
  try {
    const data = JSON.parse(json);
    if (!data.messages || !Array.isArray(data.messages)) return null;
    return {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      title: data.title || "Conversación importada",
      messages: data.messages.map((m: Record<string, unknown>, i: number) => ({
        id: `${Date.now()}-${i}`,
        role: (m.role as "user" | "assistant") || "user",
        content: (m.content as string) || "",
        timestamp: (m.timestamp as number) || Date.now(),
      })),
      modelId: (data.modelId as string) || "unknown",
      agentId: (data.agentId as string) || "assistant",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      estimatedTokens: (data.estimatedTokens as number) || 0,
      pinned: false,
    };
  } catch {
    return null;
  }
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
