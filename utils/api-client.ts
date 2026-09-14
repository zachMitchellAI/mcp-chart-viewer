import type { ChartDataDTO } from "./chart-schemas";
import type { McpServerInput, McpServerValue } from "./db/db.interface";
import { API_ENDPOINTS } from "./api.constants";

export function fetchMcpServers(): Promise<McpServerValue[]> {
  return $fetch<McpServerValue[]>(API_ENDPOINTS.MCP_SERVERS);
}

export function createMcpServer(
  server: McpServerInput,
): Promise<McpServerValue | undefined> {
  return $fetch<McpServerValue | undefined>(API_ENDPOINTS.MCP_SERVERS, {
    method: "POST",
    body: server,
  });
}

export function saveMcpServer(
  server: McpServerValue,
): Promise<{ ok: boolean }> {
  return $fetch<{ ok: boolean }>(API_ENDPOINTS.MCP_SERVERS, {
    method: "PATCH",
    body: server,
  });
}

export function deleteMcpServer(id: number): Promise<{ ok: boolean }> {
  return $fetch<{ ok: boolean }>(API_ENDPOINTS.MCP_SERVERS, {
    method: "DELETE",
    body: { id },
  });
}

export function fetchUserSettings(): Promise<Record<string, string>> {
  return $fetch<Record<string, string>>(API_ENDPOINTS.USER_SETTINGS);
}

export function saveUserSettings(
  settings: Record<string, string>,
): Promise<{ ok: boolean }> {
  return $fetch<{ ok: boolean }>(API_ENDPOINTS.USER_SETTINGS, {
    method: "POST",
    body: settings,
  });
}

export function fetchNeedsApiKey(): Promise<boolean> {
  return $fetch<{ result: boolean }>(API_ENDPOINTS.NEEDS_API_KEY).then(
    (response) => response.result,
  );
}

export function askForDataset(
  query: string,
  mcpServerIds: number[],
): Promise<ChartDataDTO> {
  return $fetch<ChartDataDTO>(API_ENDPOINTS.ASK, {
    method: "POST",
    body: { query, mcpServerIds },
  });
}
