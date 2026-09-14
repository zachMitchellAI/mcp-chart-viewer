<template>
  <div class="d-flex justify-start mt-2">
    <v-btn
      prepend-icon="mdi-plus"
      variant="text"
      color="primary"
      aria-label="Add MCP server"
      text="New"
      :disabled="showDraft"
      @click="onAddServer"
    ></v-btn>
  </div>
  <v-expansion-panels v-model="expanded">
    <v-expansion-panel
      v-for="server in servers"
      :key="server.id"
      :value="server.id"
    >
      <v-expansion-panel-title>
        <v-icon-btn
          v-ripple
          icon="mdi-delete"
          variant="plain"
          aria-label="Delete MCP server"
          @click.stop="deleteServer(server)"
        ></v-icon-btn>
        <span>{{ server.name }}</span>
        <span class="text-medium-emphasis text-body-2 ml-3">
          {{ serverSubtitle(server) }}
        </span>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-form
          validate-on="submit lazy"
          @submit.prevent="saveServer(server, $event)"
        >
          <v-text-field
            v-model="server.name"
            label="Name"
            :rules="[requiredRule]"
          ></v-text-field>
          <v-checkbox
            v-model="server.isRemote"
            label="Remote server"
            hide-details
          ></v-checkbox>
          <v-text-field
            v-if="server.isRemote"
            v-model="server.url"
            label="URL"
            :rules="[requiredRule]"
          ></v-text-field>
          <v-text-field
            v-else
            v-model="server.command"
            label="Command"
            :rules="[requiredRule]"
          ></v-text-field>
          <v-textarea
            v-model="server.env"
            label="Environment variables (JSON)"
            hint='Optional. e.g. {"KEY": "value"}'
            persistent-hint
            :rules="[envRule]"
          ></v-textarea>
          <v-textarea
            v-model="server.agentInstructions"
            label="Agent instructions"
            hint="Optional. Appended to the data-gathering agent's prompt when this server's tools are used"
            persistent-hint
          ></v-textarea>
          <v-btn class="mt-2" type="submit" text="Save" color="primary"></v-btn>
        </v-form>
      </v-expansion-panel-text>
    </v-expansion-panel>

    <v-expansion-panel v-if="showDraft" :value="MCP_SERVER_DRAFT_PANEL_ID">
      <v-expansion-panel-title>
        <span>New MCP server</span>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-form
          validate-on="submit lazy"
          @submit.prevent="createServer($event)"
        >
          <v-text-field
            v-model="draft.name"
            label="Name"
            :rules="[requiredRule]"
          ></v-text-field>
          <v-checkbox
            v-model="draft.isRemote"
            label="Remote server"
            hide-details
          ></v-checkbox>
          <v-text-field
            v-if="draft.isRemote"
            v-model="draft.url"
            label="URL"
            :rules="[requiredRule]"
          ></v-text-field>
          <v-text-field
            v-else
            v-model="draft.command"
            label="Command"
            :rules="[requiredRule]"
          ></v-text-field>
          <v-textarea
            v-model="draft.env"
            label="Environment variables (JSON)"
            hint='Optional. e.g. {"KEY": "value"}'
            persistent-hint
            :rules="[envRule]"
          ></v-textarea>
          <v-textarea
            v-model="draft.agentInstructions"
            label="Agent instructions"
            hint="Optional. Appended to the data-gathering agent's prompt when this server's tools are used"
            persistent-hint
          ></v-textarea>
          <v-row class="mt-1">
            <v-col cols="auto">
              <v-btn type="submit" text="Create" color="primary"></v-btn>
            </v-col>
            <v-col cols="auto">
              <v-btn variant="text" text="Cancel" @click="cancelDraft"></v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup lang="ts">
const servers = ref<McpServerValue[]>([]);
const showDraft = ref(false);
const draft = ref<McpServerInput>(createBlankDraft());
const expanded = ref<number | null>(null);

type FormRule = (value: string | undefined) => true | string;
type FormSubmitEvent = Event & Promise<{ valid: boolean }>;

const requiredRule: FormRule = (value) =>
  (!!value && value.trim().length > 0) || "Required";

const envRule: FormRule = (value) =>
  isValidEnvJson(value ?? "") ||
  'Must be valid JSON object of string values, e.g. {"KEY": "value"}';

function createBlankDraft(): McpServerInput {
  return {
    name: "",
    isRemote: false,
    url: "",
    command: "",
    env: "",
    agentInstructions: "",
  };
}

function isValidEnvJson(value: string): boolean {
  if (value.trim() === "") return true;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return false;
    }
    return Object.values(parsed).every((entry) => typeof entry === "string");
  } catch {
    return false;
  }
}

async function refreshServers(): Promise<void> {
  try {
    const response = await fetch("/api/mcp-servers");
    if (!response.ok) {
      throw new Error(`Failed to fetch MCP servers: ${response.status}`);
    }
    servers.value = (await response.json()) as McpServerValue[];
  } catch (error) {
    console.error("Failed to fetch MCP servers", error);
  }
}

function serverSubtitle(server: McpServerValue): string {
  return server.isRemote ? (server.url ?? "") : (server.command ?? "");
}

function onAddServer(): void {
  draft.value = createBlankDraft();
  showDraft.value = true;
  expanded.value = MCP_SERVER_DRAFT_PANEL_ID;
}

function cancelDraft(): void {
  showDraft.value = false;
  expanded.value = null;
}

async function createServer(event: FormSubmitEvent): Promise<void> {
  const results = await event;
  if (!results.valid) return;
  try {
    const response = await fetch("/api/mcp-servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft.value),
    });
    if (!response.ok) {
      throw new Error(`Failed to create MCP server: ${response.status}`);
    }
    await refreshServers();
    showDraft.value = false;
    expanded.value = null;
  } catch (error) {
    console.error("Failed to create MCP server", error);
    alert("Creating MCP server failed. Please try again.");
  }
}

async function saveServer(
  server: McpServerValue,
  event: FormSubmitEvent,
): Promise<void> {
  const results = await event;
  if (!results.valid) return;
  try {
    const response = await fetch("/api/mcp-servers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(server),
    });
    if (!response.ok) {
      throw new Error(`Failed to save MCP server: ${response.status}`);
    }
    await refreshServers();
    expanded.value = null;
  } catch (error) {
    console.error("Failed to save MCP server", error);
    alert("Saving MCP server failed. Please try again.");
  }
}

async function deleteServer(server: McpServerValue): Promise<void> {
  if (!confirm(`Delete MCP server "${server.name}"?`)) return;
  try {
    const response = await fetch("/api/mcp-servers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: server.id }),
    });
    if (!response.ok) {
      throw new Error(`Failed to delete MCP server: ${response.status}`);
    }
    if (expanded.value === server.id) {
      expanded.value = null;
    }
    await refreshServers();
  } catch (error) {
    console.error("Failed to delete MCP server", error);
    alert("Deleting MCP server failed. Please try again.");
  }
}

onMounted(refreshServers);

defineExpose({ refreshServers });
</script>
