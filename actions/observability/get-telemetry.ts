"use server";

import { requireCurrentWorkspace } from "@/lib/workspace";
import { getPipelineTelemetry } from "@/lib/rag/observability/telemetry";

export async function getWorkspaceTelemetry() {
  const workspace = await requireCurrentWorkspace();
  return getPipelineTelemetry(workspace.id);
}
