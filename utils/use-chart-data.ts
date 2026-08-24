import { defineStore } from "pinia";
import type {
  Collection,
  ChartDataState,
  ChartDataSkeleton,
} from "./use-chart-data.interface";
import { type ChartDataDTO, AnyChartDataDTOSchema } from "./chart-schemas";
import {
  COLLECTION_QUERY_PARAM,
  DATASET_QUERY_PARAM,
  STATIC_COLLECTION_NAME,
  WOLFRAM_COLLECTION_NAME,
  WOLFRAM_STORAGE_KEY,
} from "./history.constants";
import { slugify } from "./slugify";

export const useChartData = defineStore("chart-data", {
  state: () => {
    const stateDraft = {
      collections: [],
      activeCollection: null,
      activeDataset: null,
      initialized: false,
    } as ChartDataState;

    if (stateDraft.collections[0]) {
      stateDraft.activeCollection = stateDraft.collections[0];
    }

    return stateDraft;
  },
  actions: {
    setActiveCollection(collection: Collection | null) {
      this.activeCollection = collection;
    },

    setActiveDataset(dataset: ChartDataDTO | null) {
      this.activeDataset = dataset;
    },

    async initialize() {
      if (this.initialized) return;
      this.initialized = true;

      this.initializeCollections([
        {
          name: WOLFRAM_COLLECTION_NAME,
          queriable: true,
          entries: this.loadWolframEntries(),
        },
        {
          name: STATIC_COLLECTION_NAME,
          queriable: false,
          entries: [],
        },
      ]);

      await this.loadStaticEntries();
    },

    loadWolframEntries(): ChartDataDTO[] {
      const raw = localStorage.getItem(WOLFRAM_STORAGE_KEY);
      if (!raw) return [];

      try {
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        const entries: ChartDataDTO[] = [];
        for (const entry of parsed) {
          const result = AnyChartDataDTOSchema.safeParse(entry);
          if (result.success) {
            entries.push({
              ...(result.data as Record<string, unknown>),
              loading: false,
            } as ChartDataDTO);
          } else {
            console.warn("Discarding invalid stored dataset:", result.error);
          }
        }
        return entries;
      } catch (e) {
        console.error("Failed to parse stored wolfram queries:", e);
        return [];
      }
    },

    async loadStaticEntries() {
      try {
        const data = await $fetch<ChartDataDTO[]>("/static-chart-data.json");
        const staticCollection = this.collections.find(
          (c) => c.name === STATIC_COLLECTION_NAME,
        );
        if (staticCollection) {
          staticCollection.entries = data;
        }
      } catch (e) {
        console.error("Failed to load static chart data:", e);
      }
    },

    persistWolframEntries() {
      const wolframCollection = this.collections.find(
        (c) => c.name === WOLFRAM_COLLECTION_NAME,
      );
      if (!wolframCollection) return;

      const persistable = wolframCollection.entries
        .filter((entry): entry is ChartDataDTO => !entry.loading)
        .map((entry) => {
          const { loading: _loading, ...rest } = entry;
          return rest;
        });

      localStorage.setItem(WOLFRAM_STORAGE_KEY, JSON.stringify(persistable));
    },

    async queryNewDataset(query: string) {
      // A fake dataset until we get a query back from wolfram.
      const skeletonDataset = {
        loading: true,
      } as ChartDataSkeleton;

      this.activeCollection?.entries.push(skeletonDataset);

      const response = await fetch(
        `/api/ask-wolfram?q=${encodeURIComponent(query)}`,
      );
      const data = JSON.parse(await response.text());

      // @ts-ignore
      if (!data["message"]) {
        // console.log(data);
        // Our data is ready & ripe for the taking:
        this.activeCollection?.entries.pop();
        this.activeCollection?.entries.push(data);
        this.persistWolframEntries();
        return data;
      }

      // Error case: remove skeleton and return null so caller doesn't set active dataset
      this.activeCollection?.entries.pop();
      return null;
    },

    initializeCollections(newCollections: Collection[]) {
      this.collections.push(...newCollections);

      if (!this.activeCollection && this.collections[0]) {
        this.activeCollection = this.collections[0];
      }
    },

    applyHistoryState(
      collectionSlug: string | null,
      datasetSlug: string | null,
    ) {
      let scope: Collection | null = this.activeCollection;

      if (collectionSlug !== null) {
        scope =
          this.collections.find((c) => slugify(c.name) === collectionSlug) ??
          null;
        this.setActiveCollection(scope);
      }

      if (datasetSlug !== null && scope) {
        const dataset =
          scope.entries.find(
            (entry): entry is ChartDataDTO =>
              !entry.loading && slugify(entry.shortenedQuery) === datasetSlug,
          ) ?? null;
        if (dataset) {
          this.setActiveDataset(dataset);
        }
      }
    },

    historyQueryFor(dataset: ChartDataDTO, collection: Collection) {
      return {
        [COLLECTION_QUERY_PARAM]: slugify(collection.name),
        [DATASET_QUERY_PARAM]: slugify(dataset.shortenedQuery),
      };
    },
  },
});
