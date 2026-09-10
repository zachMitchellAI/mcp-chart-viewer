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
          <api-settings-tab ref="apiTab" @saved="close" />
        </v-tabs-window-item>

        <v-tabs-window-item :value="MCP_SERVERS_TAB" class="px-3 pb-3">
          <mcp-servers-tab ref="mcpTab" />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const isOpen = defineModel<boolean>("isOpen", { default: false });

const tab = ref<SettingsTab>(API_SETTINGS_TAB);

const apiTab = ref<{ load: () => Promise<void> } | null>(null);
const mcpTab = ref<{ refreshServers: () => Promise<void> } | null>(null);

watch(isOpen, async (newOpen) => {
  if (!newOpen) return;
  // Wait for the dialog contents to mount so the tab refs are available
  await nextTick();
  await Promise.all([apiTab.value?.load(), mcpTab.value?.refreshServers()]);
});

function close(): void {
  isOpen.value = false;
}
</script>
