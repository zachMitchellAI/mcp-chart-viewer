<template>
    <v-dialog v-model="isOpen" :width="SETTING_MODAL_WIDTH">
        <v-card
            prepend-icon="mdi-cog-outline"
            text=""
            title="Configuration settings"
        >
            <v-tabs v-model="tab" color="primary">
                <v-tab :value="API_SETTINGS_TAB">API Settings</v-tab>
                <v-tab :value="MCP_SERVERS_TAB">MCP Servers</v-tab>
            </v-tabs>

            <v-divider></v-divider>

            <v-tabs-window v-model="tab">
                <v-tabs-window-item :value="API_SETTINGS_TAB" class="px-3 py-3">
                    <v-row
                        v-for="field in SETTING_FIELDS"
                        :key="field.key"
                        justify="center"
                    >
                        <v-col cols="8">
                            <v-list-subheader>{{
                                field.title
                            }}</v-list-subheader>
                            <v-text-field
                                label=""
                                :model-value="settings.get(field.key)"
                                @update:model-value="
                                    valUpdate(field.key, $event)
                                "
                            ></v-text-field>
                        </v-col>
                    </v-row>
                    <v-row justify="end">
                        <v-col cols="auto">
                            <v-btn text="Ok" @click="submitChanges"></v-btn>
                        </v-col>
                    </v-row>
                </v-tabs-window-item>

                <v-tabs-window-item :value="MCP_SERVERS_TAB" class="px-3 pb-3">
                    <div class="d-flex justify-start mt-2">
                        <v-btn
                            icon="mdi-plus"
                            variant="text"
                            color="primary"
                            aria-label="Add MCP server"
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
                                <span>{{ server.name }}</span>
                                <span
                                    class="text-medium-emphasis text-body-2 ml-3"
                                >
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
                                    <v-btn
                                        class="mt-2"
                                        type="submit"
                                        text="Save"
                                        color="primary"
                                    ></v-btn>
                                </v-form>
                            </v-expansion-panel-text>
                        </v-expansion-panel>

                        <v-expansion-panel
                            v-if="showDraft"
                            :value="MCP_SERVER_DRAFT_PANEL_ID"
                        >
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
                                    <v-row class="mt-1">
                                        <v-col cols="auto">
                                            <v-btn
                                                type="submit"
                                                text="Create"
                                                color="primary"
                                            ></v-btn>
                                        </v-col>
                                        <v-col cols="auto">
                                            <v-btn
                                                variant="text"
                                                text="Cancel"
                                                @click="cancelDraft"
                                            ></v-btn>
                                        </v-col>
                                    </v-row>
                                </v-form>
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>
                </v-tabs-window-item>
            </v-tabs-window>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>("isOpen", { default: false });

const tab = ref<SettingsTab>(API_SETTINGS_TAB);

const settings = ref(new Map<string, string>());

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

watch(isOpen, async (newOpen) => {
    if (newOpen) {
        // Attempt to fetch the latest settings here
        const results = JSON.parse(
            await (await fetch("/api/user-settings")).text(),
        );
        for (const i in results) {
            settings.value.set(i, results[i]);
        }

        console.log(settings.value);

        await refreshServers();
    }
});

function createBlankDraft(): McpServerInput {
    return { name: "", isRemote: false, url: "", command: "", env: "" };
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
        return Object.values(parsed).every(
            (entry) => typeof entry === "string",
        );
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
    } catch (error) {
        console.error("Failed to save MCP server", error);
        alert("Saving MCP server failed. Please try again.");
    }
}

function valUpdate(key: string, evt: string) {
    console.log(key, evt);
    settings.value.set(key, evt);
}

async function submitChanges() {
    try {
        const response = await fetch("/api/user-settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(settings.value)),
        });
        if (!response.ok) {
            throw new Error(`Failed to save settings: ${response.status}`);
        }
    } catch (error) {
        console.error("Failed to save settings", error);
        alert("Saving settings failed. Please try again.");
    } finally {
        isOpen.value = false;
    }
}
</script>
