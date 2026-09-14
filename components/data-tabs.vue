<template>
  <v-sheet elevation="2">
    <div class="d-flex align-center">
      <v-tabs color="primary" v-model="tab" class="flex-grow-1">
        <v-tab
          v-for="coll in chartData.collections"
          :key="coll.id"
          :value="coll.id"
        >
          {{ coll.name }}
        </v-tab>
      </v-tabs>
    </div>

    <div class="px-2 pt-1" v-if="chartData.activeCollection">
      <div class="d-flex justify-space-between align-center w-100">
        <v-btn
          prepend-icon="mdi-cog-outline"
          variant="text"
          aria-label="Tab settings"
          @click="onEditTab"
        >
          Configure
        </v-btn>
        <v-btn
          prepend-icon="mdi-plus"
          variant="text"
          color="primary"
          aria-label="New tab"
          @click="onCreateTab"
        >
          New Tab
        </v-btn>
      </div>
    </div>
    <v-divider></v-divider>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item
        v-for="coll in chartData.collections"
        :key="coll.id"
        :value="coll.id"
      >
        <v-sheet class="pa-5">
          <prompt-box />
        </v-sheet>

        <data-iterator
          :collection="coll"
          :active-dataset="chartData.activeDataset"
          @set-active-dataset="
            (dataset: ChartDataDTO) => onSelectDataset(dataset, coll)
          "
          @delete-dataset="onDeleteDataset"
        />
      </v-tabs-window-item>
    </v-tabs-window>

    <collection-config-modal
      v-model:is-open="modalOpen"
      :mode="modalMode"
      :collection="editedCollection"
      @saved="onModalSaved"
    />
  </v-sheet>
</template>

<script setup lang="ts">
const chartData = useChartData();
const route = useRoute();
const router = useRouter();
const tab = ref("");

const modalOpen = ref(false);
const modalMode = ref<CollectionModalMode>("create");
const editedCollection = ref<Collection | null>(null);

function onSelectDataset(dataset: ChartDataDTO, collection: Collection): void {
  chartData.setActiveDataset(dataset);

  const nextQuery = chartData.historyQueryFor(dataset, collection);
  if (
    route.query[COLLECTION_QUERY_PARAM] === nextQuery[COLLECTION_QUERY_PARAM] &&
    route.query[DATASET_QUERY_PARAM] === nextQuery[DATASET_QUERY_PARAM]
  ) {
    return;
  }

  router.push({ query: { ...route.query, ...nextQuery } });
}

function onDeleteDataset(dataset: ChartDataDTO, collection: Collection): void {
  chartData.deleteDataset(dataset, collection);
}

function onCreateTab(): void {
  modalMode.value = "create";
  editedCollection.value = null;
  modalOpen.value = true;
}

function onEditTab(): void {
  modalMode.value = "edit";
  editedCollection.value = chartData.activeCollection;
  modalOpen.value = true;
}

function onModalSaved(collection: Collection): void {
  chartData.setActiveCollection(collection);
}

watch(tab, (newTab) => {
  const selected = (chartData.collections as Collection[]).find(
    (c) => c.id === newTab,
  );
  chartData.setActiveCollection(selected ?? null);
});

watch(
  () => chartData.activeCollection?.id,
  (id) => {
    if (id) tab.value = id;
  },
  { immediate: true },
);
</script>
