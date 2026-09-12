import { type ChartDataDTO } from "./chart-schemas";

export type ChartDataSkeleton = Partial<ChartDataDTO> & { loading: true };

export interface Collection {
  id: string;
  name: string;
  mcpServerIds: number[];
  entries: Array<ChartDataDTO | ChartDataSkeleton>;
}

// Persisted tab configuration (entries live under a separate storage key)
export interface TabConfig {
  id: string;
  name: string;
  mcpServerIds: number[];
}

// Initial state for pinia
export interface ChartDataState {
  collections: Collection[];
  activeDataset: ChartDataDTO | null;
  activeCollection: Collection | null;
  initialized: boolean;
  wolframServerId: number | null;
}
