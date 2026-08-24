import { type ChartDataDTO } from "./chart-schemas";

export type ChartDataSkeleton = Partial<ChartDataDTO> & { loading: true };

export interface Collection {
  name: string;
  queriable: boolean;
  entries: Array<ChartDataDTO | ChartDataSkeleton>;
}

// Initial state for pinia
export interface ChartDataState {
  collections: Collection[];
  activeDataset: ChartDataDTO | null;
  activeCollection: Collection | null;
  initialized: boolean;
}
