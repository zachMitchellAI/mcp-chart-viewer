<style scoped>
.entries-scroll {
  max-height: 65vh;
  overflow-y: auto;
}
</style>

<template>
  <div class="entries-scroll">
    <v-data-iterator
      :items="props.collection.entries"
      item-value="shortenedQuery"
      :items-per-page="-1"
    >
      <template v-slot:default="{ items, isExpanded, toggleExpand }">
        <v-row>
          <v-col v-for="item in items" :key="item.raw.shortenedQuery" cols="12">
            <v-skeleton-loader hhttps://
              class="border"
              :type="['image', 'heading', 'text']"
              :loading="item.raw.loading"
              v-if="item.raw.loading"
            ></v-skeleton-loader>

            <v-card
              :variant="props.activeDataset === item.raw ? 'tonal' : 'elevated'"
              class="cursor-pointer"
              @click="props.onSetActiveDataset(item.raw)"
              v-else
            >
              <v-card-title class="d-flex align-center">
                <v-icon
                  color="primary"
                  icon="mdi-chart-box"
                  size="18"
                  start
                ></v-icon>
                <h4 class="my-0 text-body-1 font-weight-medium">
                  {{ item.raw.shortenedQuery }}
                </h4>
              </v-card-title>

              <v-card-text>
                {{ item.raw.query }}
              </v-card-text>

              <div class="px-4 d-flex align-center">
                <v-switch
                  class="flex-grow-1"
                  :label="`${isExpanded(item as any) ? 'Hide' : 'Show'} details`"
                  :model-value="isExpanded(item as any)"
                  density="compact"
                  inset
                  @click.stop="() => toggleExpand(item as any)"
                >
                </v-switch>
                <v-icon-btn
                  v-ripple
                  class="align-self-start"
                  :icon="
                    checkCacheMap.get(item.raw)
                      ? 'mdi-check-circle-outline'
                      : 'mdi-content-copy'
                  "
                  variant="plain"
                  :color="checkCacheMap.get(item.raw) ? 'success' : ''"
                  @click.stop="() => copyToClipboard(item.raw as ChartDataDTO)"
                ></v-icon-btn>
                <v-icon-btn
                  v-if="!item.raw.loading"
                  v-ripple
                  class="align-self-start"
                  icon="mdi-delete"
                  variant="plain"
                  color="error"
                  @click.stop="
                    () =>
                      props.onDeleteDataset?.(item.raw as any, props.collection)
                  "
                ></v-icon-btn>
              </div>

              <v-divider></v-divider>

              <v-expand-transition>
                <div v-if="isExpanded(item as any)">
                  <v-list :lines="false" density="compact">
                    <v-list-item
                      :title="`Type: ${item.raw.dataset?.type}`"
                    ></v-list-item>
                    <v-list-item
                      v-if="item.raw.toolCallsUsed"
                      :title="`Tool Calls Used: ${item.raw.toolCallsUsed}`"
                    ></v-list-item>
                    <v-list-item
                      :title="`Labels: ${item.raw.dataset?.data.labels?.join(', ')}`"
                    ></v-list-item>
                    <v-list-item
                      v-for="(dataset, index) in item.raw.dataset?.data
                        .datasets"
                      :key="index"
                      :title="`Dataset ${index + 1}: ${dataset.label || 'Unlabeled'}`"
                    >
                    </v-list-item>
                  </v-list>
                </div>
              </v-expand-transition>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </v-data-iterator>
  </div>
</template>

<script setup lang="ts">
export interface DataIteratorProps {
  collection: Collection;
  activeDataset: ChartDataDTO | null;
  onSetActiveDataset: (dataset: ChartDataDTO) => void;
  onDeleteDataset: (dataset: ChartDataDTO, collection: Collection) => void;
}

const checkCacheMap = ref(new Map<ChartDataDTO, NodeJS.Timeout>());

const props = withDefaults(defineProps<DataIteratorProps>(), {
  activeDataset: null,
  onSetActiveDataset: () => {},
  onDeleteDataset: () => {},
});

function toggleTimeoutCopyBtnToCheck(entry: ChartDataDTO) {
  const prevValue: NodeJS.Timeout | undefined = checkCacheMap.value.get(entry);

  if (prevValue !== undefined) {
    clearTimeout(prevValue);
    checkCacheMap.value.delete(entry);
  }

  checkCacheMap.value.set(
    entry,
    setTimeout(() => {
      checkCacheMap.value.delete(entry);
    }, 2000),
  );
}

function copyToClipboard(entry: ChartDataDTO) {
  try {
    navigator.clipboard.writeText(
      "```json\n" + JSON.stringify(entry, null, 4) + "\n```",
    );
    toggleTimeoutCopyBtnToCheck(entry);
  } catch (e) {
    console.error("Could not write to clipboard!", e);
  }
}
</script>
