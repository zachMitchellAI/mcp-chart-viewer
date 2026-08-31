<template>
  <v-sheet class="pa-0">
    <v-textarea
      :label="placeholder"
      variant="solo"
      :disabled="boxDisabled"
      v-model="query"
      @keydown.enter.exact="submit"
    />
  </v-sheet>
</template>

<script setup lang="ts">
// TODO: it's not possible to import types right now on the latest version of TS if this is purely CLI/Server Side.
// Strange quirk, because in some files, zod types can work perfectly fine (z.infer perhaps)
// Would be worth changing at some point, but right now it's fine to just have these in the vue files as a single unit
// https://github.com/vuejs/vue-jest/issues/565
export interface PromptBoxProps {
  placeholder?: string;
}

const props = withDefaults(defineProps<PromptBoxProps>(), {
  placeholder: "Ask me! / Paste Chart JSON!",
});

const chartData = useChartData();
const query = ref("");
const boxDisabled = ref(false);

async function submit(evt: Event): Promise<void> {
  let finishedDataset;
  if (boxDisabled.value || !query.value.trim()) {
    // Don't submit anything, don't hit enter!
    evt.preventDefault();
    query.value = "";
    return;
  }

  boxDisabled.value = true;

  if (/```json/.test(query.value)) {
    // This is JSON... parse it!
    try {
      const parsedDataset = JSON.parse(
        query.value.replace("```json", "").replace("```", ""),
      );

      finishedDataset = chartData.directlyAddNewDataset(parsedDataset);
    } catch (e) {
      alert("Failed to parse dataset! Malformed JSON");
      console.error("Failed to parse dataset!", e);
    }
  } else {
    finishedDataset = await chartData.queryNewDataset(query.value);
  }

  if (finishedDataset) {
    chartData.setActiveDataset(finishedDataset);
    console.log("active dataset", chartData.activeDataset);
  }

  query.value = "";
  boxDisabled.value = false;
}
</script>
