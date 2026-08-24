<template>
  <v-sheet elevation="2">
    <v-tabs color="primary" v-model="tab">
      <v-tab
        v-for="coll in chartData.collections"
        :key="coll.name"
        :value="slugify(coll.name)"
      >
        {{ coll.name }}
      </v-tab>
    </v-tabs>

    <v-divider></v-divider>

    <v-tabs-window v-model="tab">
      <v-tabs-window-item
        v-for="coll in chartData.collections"
        :key="coll.name"
        :value="slugify(coll.name)"
      >
        <v-sheet class="pa-5" v-if="coll.queriable">
          <prompt-box />
        </v-sheet>

        <data-iterator
          :items="coll?.entries"
          :active-dataset="chartData.activeDataset"
          @set-active-dataset="
            (dataset: ChartDataDTO) => onSelectDataset(dataset, coll)
          "
        />
      </v-tabs-window-item>
    </v-tabs-window>
  </v-sheet>
</template>

<script setup lang="ts">
const chartData = useChartData();
const route = useRoute();
const router = useRouter();
const tab = ref("");

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

watch(tab, (newTab) => {
  const selected = (chartData.collections as Collection[]).find(
    (c) => slugify(c.name) === newTab,
  );
  chartData.setActiveCollection(selected ?? null);
});

watch(
  () => chartData.activeCollection?.name,
  (name) => {
    if (name) tab.value = slugify(name);
  },
  { immediate: true },
);
</script>
