<style scoped>
.server-checklist {
  max-height: 260px;
  overflow-y: auto;
}
</style>

<template>
  <v-dialog v-model="isOpen" :width="COLLECTION_MODAL_WIDTH">
    <v-card
      :prepend-icon="isCreate ? 'mdi-tab-plus' : 'mdi-pencil-outline'"
      :title="isCreate ? 'New tab' : 'Edit tab'"
    >
      <v-card-text>
        <v-form ref="form" validate-on="submit lazy" @submit.prevent="onSave">
          <v-text-field
            v-model="tabName"
            label="Tab name"
            :rules="nameRules"
            counter="48"
          ></v-text-field>

          <div class="text-subtitle-2 mt-2 mb-1">MCP servers</div>
          <div v-if="loadingServers" class="text-medium-emphasis py-2">
            Loading servers...
          </div>
          <div
            v-else-if="servers.length === 0"
            class="text-medium-emphasis py-2"
          >
            No MCP servers configured. Add them via the settings menu.
          </div>
          <div v-else class="server-checklist">
            <v-checkbox
              v-for="server in servers"
              :key="server.id"
              v-model="selectedIds"
              :value="server.id"
              :label="server.name"
              density="compact"
              hide-details
            ></v-checkbox>
          </div>
        </v-form>
      </v-card-text>

      <template #actions>
        <v-btn
          v-if="!isCreate"
          text="Delete"
          color="error"
          variant="text"
          @click="onDelete"
        ></v-btn>
        <v-spacer></v-spacer>
        <v-btn text="Save" color="primary" @click="onSave"></v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
// Types can't be imported in .vue scripts on this TS version (see prompt-box.vue)
export interface CollectionConfigModalProps {
  mode: CollectionModalMode;
  collection?: Collection | null;
}

type FormRule = (value: string) => true | string;
type FormRef = {
  validate: () => Promise<{ valid: boolean }>;
};

const props = withDefaults(defineProps<CollectionConfigModalProps>(), {
  collection: null,
});

const emit = defineEmits<{
  saved: [collection: Collection];
}>();

const isOpen = defineModel<boolean>("isOpen", { default: false });

const chartData = useChartData();

const form = ref<FormRef | null>(null);
const tabName = ref("");
const selectedIds = ref<number[]>([]);
const servers = ref<McpServerValue[]>([]);
const loadingServers = ref(false);

const isCreate = computed(() => props.mode === "create");

const nameRules: FormRule[] = [
  (value) => (!!value && value.trim().length > 0) || "Required",
  (value) => (value && value.length <= 48) || "Must be 48 characters or fewer",
  (value) => {
    if (!value) return true;
    const clash = chartData.collections.find(
      (c) =>
        c.name.toLowerCase() === value.trim().toLowerCase() &&
        c.id !== props.collection?.id,
    );
    return clash ? "A tab with this name already exists" : true;
  },
];

watch(isOpen, async (newOpen) => {
  if (!newOpen) return;

  tabName.value = props.collection?.name ?? "";
  selectedIds.value = [...(props.collection?.mcpServerIds ?? [])];
  await Promise.all([nextTick(), refreshServers()]);
});

function close(): void {
  isOpen.value = false;
}

async function refreshServers(): Promise<void> {
  loadingServers.value = true;
  try {
    const response = await $fetch<McpServerValue[]>("/api/mcp-servers");
    servers.value = response;
  } catch (e) {
    console.error("Failed to fetch MCP servers", e);
    servers.value = [];
  } finally {
    loadingServers.value = false;
  }
}

async function onSave(): Promise<void> {
  if (form.value) {
    const { valid } = await form.value.validate();
    if (!valid) return;
  }

  const name = tabName.value.trim();
  const ids = [...selectedIds.value];

  if (isCreate.value) {
    const created = chartData.addCollection(name, ids);
    emit("saved", created);
  } else if (props.collection) {
    const updated = chartData.updateCollection(props.collection.id, {
      name,
      mcpServerIds: ids,
    });
    if (updated) {
      emit("saved", updated);
    }
  }

  close();
}

function onDelete(): void {
  const collection = props.collection;
  if (!collection) return;
  if (!confirm(`Delete tab "${collection.name}" and its saved queries?`)) {
    return;
  }

  chartData.deleteCollection(collection.id);
  close();
}
</script>
