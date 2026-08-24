<style scoped>
.bar {
  border-radius: 0.2em;
  position: unset !important;
  margin-bottom: 1em;
}

.theme-btn {
  margin-right: 1em;
}
</style>

<template>
  <v-app-bar class="bar" :title="computedTitle">
    <v-icon-btn
      class="theme-btn"
      :icon="THEME_ICONS[theme]"
      @click="themeBtnClick"
    >
    </v-icon-btn>
  </v-app-bar>
</template>

<script setup lang="ts">
interface AppTitleBarProps {
  activeDataset: ChartDataDTO;
  existingTheme: Theme;
  onthemeChanged?: (theme: Theme) => void;
}

const props = withDefaults(defineProps<AppTitleBarProps>(), {
  existingTheme: "",
});

const theme = ref<Theme>(props.existingTheme);

const computedTitle = computed(() => {
  const base = "Wolfram Chart Viewer";
  const subtitle = props.activeDataset?.shortenedQuery;
  return subtitle ? `${base} - ${subtitle}` : base;
});

function themeBtnClick() {
  const currentIndex = THEMES.indexOf(theme.value);
  const nextIndex = (currentIndex + 1) % THEMES.length;
  const nextTheme = THEMES[nextIndex] ?? "";
  theme.value = nextTheme;
  props.onthemeChanged?.(nextTheme);
}
</script>
