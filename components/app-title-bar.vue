<style scoped>
.bar {
    border-radius: 0.2em;
    position: unset !important;
    margin-bottom: 1em;
}
</style>

<template>
    <v-app-bar class="bar" :title="computedTitle">
        <v-btn
            variant="elevated"
            :prependIcon="themeSettings[theme][1]"
            @click="themeBtnClick"
        >
            {{ capitalize(themeSettings[theme][0] || "auto") }}
        </v-btn>
    </v-app-bar>
</template>

<script setup lang="ts">
interface AppTitleBarProps {
    activeDataset: ChartDataDTO;
    existingTheme?: "" | "dark" | "light";
    onthemeChanged?: (theme: string) => void;
}

const props = defineProps<AppTitleBarProps>();

const capitalize = (str: string) => str[0]?.toUpperCase() + str.substring(1);
// Indexes to cycle through depending on the theme the user would like to use
const themeSettings = [
    ["", "mdi-theme-light-dark"],
    ["dark", "mdi-weather-night"],
    ["light", "mdi-weather-sunny"],
];

const theme = ref(
    themeSettings.indexOf(
        themeSettings.find((e) => e[0] === (props.existingTheme || "")),
    ) || 0,
);

const computedTitle = computed(() => {
    const base = "Wolfram Chart Viewer";
    const subtitle = props.activeDataset?.shortenedQuery;
    return subtitle ? `${base} - ${subtitle}` : base;
});

function themeBtnClick() {
    if (theme.value === themeSettings.length - 1) {
        theme.value = 0;
    } else theme.value += 1;

    if (props.onthemeChanged)
        props.onthemeChanged?.(themeSettings[theme.value][0]);
}
</script>
