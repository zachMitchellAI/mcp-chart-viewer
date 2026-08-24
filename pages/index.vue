<template>
  <v-app :theme="existingTheme">
    <v-container fluid class="fg-surface-variant h-100">
      <app-title-bar
        :active-dataset="chartData.activeDataset!"
        :existing-theme="existingTheme"
        :ontheme-changed="onThemeChanged"
      />
      <v-row gap="16" size="5">
        <v-col cols="4">
          <v-card :elevation="3" height="100%">
            <chart-js-wrapper :config="chartData.activeDataset?.dataset" />
          </v-card>
        </v-col>

        <v-col cols="1">
          <data-tabs />
        </v-col>
      </v-row>
    </v-container>
    <openrouter-warning-snackbar />
  </v-app>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false });
const chartData = useChartData();
const route = useRoute();
const existingTheme = ref<Theme>(
  (localStorage.getItem("theme") as "" | "dark" | "light" | null) ?? "",
);

const onThemeChanged = (theme: Theme) => {
  existingTheme.value = theme;
  localStorage.setItem("theme", theme);
};

function applyHistoryFromRoute(): void {
  const collectionSlug = route.query[COLLECTION_QUERY_PARAM];
  const datasetSlug = route.query[DATASET_QUERY_PARAM];

  chartData.applyHistoryState(
    typeof collectionSlug === "string" ? collectionSlug : null,
    typeof datasetSlug === "string" ? datasetSlug : null,
  );
}

onMounted(async () => {
  await chartData.initialize();
  applyHistoryFromRoute();
});

watch(() => route.query, applyHistoryFromRoute);
</script>
