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
                        <chart-js-wrapper
                            :config="chartData.activeDataset?.dataset"
                        />
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
const existingTheme = ref("dark");
const onThemeChanged = (theme: string) => (existingTheme.value = theme);

if (!chartData.collections.length) {
    chartData.initializeCollections([
        {
            name: "Wolfram Queries",
            queriable: true,
            entries: [],
        },
        {
            name: "Static",
            queriable: false,
            entries: [],
        },
    ]);
}

onMounted(async () => {
    try {
        const data = await $fetch<ChartDataDTO[]>("/static-chart-data.json");
        const staticCollection = chartData.collections.find(
            (c) => c.name === "Static",
        );
        if (staticCollection) {
            staticCollection.entries = data;
        }
    } catch (e) {
        console.error("Failed to load static chart data:", e);
    }
});
</script>
