import { defineStore } from "pinia";
import type {
  Collection,
  ChartDataState,
  ChartDataSkeleton,
  TabConfig,
} from "./use-chart-data.interface";
import { type ChartDataDTO, AnyChartDataDTOSchema } from "./chart-schemas";
import {
  COLLECTION_QUERY_PARAM,
  DATASET_QUERY_PARAM,
  DEFAULT_COLLECTION_NAME,
  LEGACY_WOLFRAM_STORAGE_KEY,
  TAB_ENTRIES_STORAGE_KEY,
  TAB_STORAGE_KEY,
} from "./history.constants";
import { WOLFRAM_MCP_SERVER_NAME } from "./db/db.constants";
import { slugify } from "./slugify";

function parseEntries(raw: unknown): ChartDataDTO[] {
  if (!Array.isArray(raw)) return [];

  const entries: ChartDataDTO[] = [];
  for (const entry of raw) {
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
}

function readJsonFromStorage(key: string): unknown {
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse stored data for "${key}":`, e);
    return null;
  }
}

export const useChartData = defineStore("chart-data", {
  state: () => {
    const stateDraft = {
      collections: [],
      activeCollection: null,
      activeDataset: null,
      initialized: false,
      defaultServerId: null,
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

      await this.loadDefaultServerId();
      this.loadTabs();
    },

    async loadDefaultServerId() {
      try {
        const servers =
          await $fetch<Array<{ id: number; name: string }>>("/api/mcp-servers");
        const defaultServer = servers.find(
          (server) => server.name === WOLFRAM_MCP_SERVER_NAME,
        );
        if (!defaultServer) {
          console.warn(
            "no default MCP server found; queries will have no tools",
          );
          return;
        }
        this.defaultServerId = defaultServer.id;
      } catch (e) {
        console.error("failed to load MCP server list:", e);
      }
    },

    loadTabs() {
      const storedConfigs = readJsonFromStorage(TAB_STORAGE_KEY);

      if (Array.isArray(storedConfigs) && storedConfigs.length > 0) {
        const entriesRecord = this.loadTabEntries();
        const configs = storedConfigs.filter(
          (config): config is TabConfig =>
            typeof config === "object" &&
            config !== null &&
            typeof (config as TabConfig).id === "string" &&
            typeof (config as TabConfig).name === "string" &&
            Array.isArray((config as TabConfig).mcpServerIds),
        );
        this.initializeCollections(
          configs.map((config) => ({
            ...config,
            entries: entriesRecord[config.id] ?? [],
          })),
        );
        return;
      }

      // First run (or pre-custom-tabs data): migrate legacy entries into a
      // default tab with the default MCP server enabled.
      this.createDefaultCollection(
        parseEntries(readJsonFromStorage(LEGACY_WOLFRAM_STORAGE_KEY)),
      );
      localStorage.removeItem(LEGACY_WOLFRAM_STORAGE_KEY);
    },

    createDefaultCollection(entries: ChartDataDTO[]): Collection {
      const collection: Collection = {
        id: slugify(DEFAULT_COLLECTION_NAME),
        name: DEFAULT_COLLECTION_NAME,
        mcpServerIds:
          this.defaultServerId !== null ? [this.defaultServerId] : [],
        entries,
      };

      this.initializeCollections([collection]);
      this.persistCollections();
      this.persistEntries(collection);

      return collection;
    },

    loadTabEntries(): Record<string, ChartDataDTO[]> {
      const stored = readJsonFromStorage(TAB_ENTRIES_STORAGE_KEY);
      if (
        typeof stored !== "object" ||
        stored === null ||
        Array.isArray(stored)
      ) {
        return {};
      }

      const entriesRecord: Record<string, ChartDataDTO[]> = {};
      for (const [id, rawEntries] of Object.entries(stored)) {
        entriesRecord[id] = parseEntries(rawEntries);
      }
      return entriesRecord;
    },

    persistCollections() {
      const configs: TabConfig[] = this.collections.map((collection) => ({
        id: collection.id,
        name: collection.name,
        mcpServerIds: collection.mcpServerIds,
      }));
      localStorage.setItem(TAB_STORAGE_KEY, JSON.stringify(configs));
    },

    persistEntries(collection: Collection | null) {
      if (!collection) return;

      const stored = readJsonFromStorage(TAB_ENTRIES_STORAGE_KEY);
      const entriesRecord =
        typeof stored === "object" && stored !== null && !Array.isArray(stored)
          ? (stored as Record<string, unknown[]>)
          : {};

      entriesRecord[collection.id] = collection.entries
        .filter((entry): entry is ChartDataDTO => !entry.loading)
        .map((entry) => {
          const { loading: _loading, ...rest } = entry;
          return rest;
        });

      localStorage.setItem(
        TAB_ENTRIES_STORAGE_KEY,
        JSON.stringify(entriesRecord),
      );
    },

    addCollection(name: string, mcpServerIds: number[]): Collection {
      const id = this.uniqueCollectionId(slugify(name));

      const collection: Collection = {
        id,
        name,
        mcpServerIds: [...mcpServerIds],
        entries: [],
      };
      this.initializeCollections([collection]);
      this.persistCollections();
      this.persistEntries(collection);

      return collection;
    },

    updateCollection(
      id: string,
      patch: { name?: string; mcpServerIds?: number[] },
    ): Collection | null {
      const collection = this.collections.find((c) => c.id === id);
      if (!collection) return null;

      if (patch.name !== undefined) {
        collection.name = patch.name;
      }
      if (patch.mcpServerIds !== undefined) {
        collection.mcpServerIds = [...patch.mcpServerIds];
      }

      this.persistCollections();
      return collection;
    },

    deleteCollection(id: string): boolean {
      const index = this.collections.findIndex((c) => c.id === id);
      if (index === -1) return false;

      const collection = this.collections[index] as Collection;
      this.collections.splice(index, 1);

      const stored = readJsonFromStorage(TAB_ENTRIES_STORAGE_KEY);
      if (
        typeof stored === "object" &&
        stored !== null &&
        !Array.isArray(stored)
      ) {
        const entriesRecord = stored as Record<string, unknown>;
        delete entriesRecord[collection.id];
        localStorage.setItem(
          TAB_ENTRIES_STORAGE_KEY,
          JSON.stringify(entriesRecord),
        );
      }

      if (this.activeCollection?.id === id) {
        this.setActiveCollection(this.collections[0] ?? null);
      }
      this.persistCollections();

      // Keep at least one tab around, mirroring the first-run default.
      if (this.collections.length === 0) {
        this.createDefaultCollection([]);
      }

      return true;
    },

    uniqueCollectionId(baseId: string): string {
      const existing = new Set(this.collections.map((c) => c.id));
      if (!existing.has(baseId)) return baseId;

      let suffix = 2;
      while (existing.has(`${baseId}-${suffix}`)) {
        suffix += 1;
      }
      return `${baseId}-${suffix}`;
    },

    async queryNewDataset(query: string) {
      // A fake dataset until we get a query back from the server.
      const skeletonDataset = {
        loading: true,
      } as ChartDataSkeleton;

      this.activeCollection?.entries.push(skeletonDataset);

      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          mcpServerIds: this.activeCollection?.mcpServerIds ?? [],
        }),
      });
      const data = JSON.parse(await response.text());

      if (!data["message"]) {
        // Our data is ready & ripe for the taking:
        this.activeCollection?.entries.pop();
        this.activeCollection?.entries.push(data);
        this.persistEntries(this.activeCollection);
        return data;
      }

      // Error case: remove skeleton and return null so caller doesn't set active dataset
      this.activeCollection?.entries.pop();
      return null;
    },

    directlyAddNewDataset(dataset: ChartDataDTO): ChartDataDTO {
      this.activeCollection?.entries.push(dataset);
      this.persistEntries(this.activeCollection);

      return dataset;
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
        scope = this.collections.find((c) => c.id === collectionSlug) ?? null;
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
        [COLLECTION_QUERY_PARAM]: collection.id,
        [DATASET_QUERY_PARAM]: slugify(dataset.shortenedQuery),
      };
    },

    deleteDataset(dataset: ChartDataDTO, collection: Collection) {
      const index = collection.entries.findIndex(
        (entry): entry is ChartDataDTO => !entry.loading && entry === dataset,
      );
      if (index === -1) return false;

      collection.entries.splice(index, 1);
      this.persistEntries(collection);

      if (this.activeDataset === dataset) {
        this.setActiveDataset(null);
      }
      return true;
    },
  },
});
