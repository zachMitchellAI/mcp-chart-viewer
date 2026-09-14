// I definitely did *not* write this - this was all nemotron ultra from NVIDIA
// In real production code, you're still gonna have to verify this stuff like it or not - or perhaps use something much simpler
// This was built so that it's possible to tell LLMs in langchain how to write graphs. If you can bridge this for whatever appliction you're doing, then structured data will always be possible.

import { z } from "zod";
import { CHART_TYPES, type ChartTypeLiteral } from "./chart-types.interface";

export const ChartTypeLiteralSchema = z.enum(
  CHART_TYPES as [string, ...string[]],
);

const BarDataSchema = z.union([z.number(), z.tuple([z.number(), z.number()])]);
const LineScatterDataSchema = z.union([
  z.number(),
  z.object({ x: z.number(), y: z.number() }),
]);
const BubbleDataSchema = z.object({
  x: z.number(),
  y: z.number(),
  r: z.number(),
});
const PolarRadarPieDataSchema = z.number();

const BarChartDatasetSchema = z
  .object({
    type: z.literal("bar"),
    data: z.array(BarDataSchema),
    label: z.string().optional(),
    backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
    borderColor: z.union([z.string(), z.array(z.string())]).optional(),
    borderWidth: z.number().optional(),
    borderRadius: z
      .union([
        z.number(),
        z.object({
          topLeft: z.number(),
          topRight: z.number(),
          bottomLeft: z.number(),
          bottomRight: z.number(),
        }),
      ])
      .optional(),
    barPercentage: z.number().optional(),
    categoryPercentage: z.number().optional(),
    maxBarThickness: z.number().optional(),
    minBarLength: z.number().optional(),
    indexAxis: z.enum(["x", "y"]).optional(),
  })
  .strict();

const LineChartDatasetSchema = z
  .object({
    type: z.literal("line"),
    data: z.array(LineScatterDataSchema),
    label: z.string().optional(),
    borderColor: z.union([z.string(), z.array(z.string())]).optional(),
    borderWidth: z.number().optional(),
    backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
    fill: z
      .union([z.boolean(), z.enum(["start", "end", "origin", "stack"])])
      .optional(),
    tension: z.number().optional(),
    cubicInterpolationMode: z.enum(["default", "monotone"]).optional(),
    pointStyle: z.union([z.string(), z.array(z.string())]).optional(),
    pointRadius: z.union([z.number(), z.array(z.number())]).optional(),
    pointHoverRadius: z.union([z.number(), z.array(z.number())]).optional(),
    showLine: z.boolean().optional(),
    spanGaps: z.boolean().optional(),
  })
  .strict();

const ScatterChartDatasetSchema = z
  .object({
    type: z.literal("scatter"),
    data: z.array(LineScatterDataSchema),
    label: z.string().optional(),
    backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
    borderColor: z.union([z.string(), z.array(z.string())]).optional(),
    borderWidth: z.number().optional(),
    pointStyle: z.union([z.string(), z.array(z.string())]).optional(),
    pointRadius: z.union([z.number(), z.array(z.number())]).optional(),
    pointHoverRadius: z.union([z.number(), z.array(z.number())]).optional(),
    showLine: z.boolean().optional(),
  })
  .strict();

const BubbleChartDatasetSchema = z
  .object({
    type: z.literal("bubble"),
    data: z.array(BubbleDataSchema),
    label: z.string().optional(),
    backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
    borderColor: z.union([z.string(), z.array(z.string())]).optional(),
    borderWidth: z.number().optional(),
    radius: z.union([z.number(), z.array(z.number())]).optional(),
    hoverRadius: z.union([z.number(), z.array(z.number())]).optional(),
  })
  .strict();

const PieChartDatasetSchema = z
  .object({
    type: z.literal("pie"),
    data: z.array(PolarRadarPieDataSchema),
    label: z.string().optional(),
    backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
    borderColor: z.union([z.string(), z.array(z.string())]).optional(),
    borderWidth: z.number().optional(),
    borderAlign: z.enum(["center", "inner"]).optional(),
    hoverOffset: z.number().optional(),
    circumference: z.number().optional(),
    rotation: z.number().optional(),
  })
  .strict();

const DoughnutChartDatasetSchema = z
  .object({
    type: z.literal("doughnut"),
    data: z.array(PolarRadarPieDataSchema),
    label: z.string().optional(),
    backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
    borderColor: z.union([z.string(), z.array(z.string())]).optional(),
    borderWidth: z.number().optional(),
    borderAlign: z.enum(["center", "inner"]).optional(),
    hoverOffset: z.number().optional(),
    circumference: z.number().optional(),
    rotation: z.number().optional(),
    cutout: z.union([z.number(), z.string()]).optional(),
  })
  .strict();

const PolarAreaChartDatasetSchema = z
  .object({
    type: z.literal("polarArea"),
    data: z.array(PolarRadarPieDataSchema),
    label: z.string().optional(),
    backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
    borderColor: z.union([z.string(), z.array(z.string())]).optional(),
    borderWidth: z.number().optional(),
    borderAlign: z.enum(["center", "inner"]).optional(),
    hoverOffset: z.number().optional(),
  })
  .strict();

const RadarChartDatasetSchema = z
  .object({
    type: z.literal("radar"),
    data: z.array(PolarRadarPieDataSchema),
    label: z.string().optional(),
    backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
    borderColor: z.union([z.string(), z.array(z.string())]).optional(),
    borderWidth: z.number().optional(),
    pointBackgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
    pointBorderColor: z.union([z.string(), z.array(z.string())]).optional(),
    pointBorderWidth: z.union([z.number(), z.array(z.number())]).optional(),
    pointRadius: z.union([z.number(), z.array(z.number())]).optional(),
    pointHoverRadius: z.union([z.number(), z.array(z.number())]).optional(),
    pointHitRadius: z.union([z.number(), z.array(z.number())]).optional(),
    fill: z.boolean().optional(),
    lineTension: z.number().optional(),
  })
  .strict();

export const AnyChartDatasetSchema = z.union([
  BarChartDatasetSchema,
  LineChartDatasetSchema,
  ScatterChartDatasetSchema,
  BubbleChartDatasetSchema,
  PieChartDatasetSchema,
  DoughnutChartDatasetSchema,
  PolarAreaChartDatasetSchema,
  RadarChartDatasetSchema,
]);

export const ChartDataSchema = z
  .object({
    labels: z.array(z.string()).optional(),
    datasets: z.array(AnyChartDatasetSchema),
  })
  .strict();

export const ChartConfigurationSchema = z
  .object({
    type: ChartTypeLiteralSchema,
    data: ChartDataSchema,
    options: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const ChartDataDTOSchema = z
  .object({
    query: z.string(),
    toolCallsUsed: z.number(),
    shortenedQuery: z.string(),
    dataset: ChartConfigurationSchema,
    loading: z.boolean(),
  })
  .strict();

export type ChartDataDTO = z.infer<typeof ChartDataDTOSchema>;

// `loading` is a client-side flag, never a model output; the delegator's
// response format must not require it.
export const AgentResponseSchema = ChartDataDTOSchema.omit({ loading: true });
export type ChartConfiguration = z.infer<typeof ChartConfigurationSchema>;
export type ChartData = z.infer<typeof ChartDataSchema>;
export type AnyChartDataset = z.infer<typeof AnyChartDatasetSchema>;

const datasetSchemaByType: Record<ChartTypeLiteral, z.ZodTypeAny> = {
  bar: BarChartDatasetSchema,
  line: LineChartDatasetSchema,
  scatter: ScatterChartDatasetSchema,
  bubble: BubbleChartDatasetSchema,
  pie: PieChartDatasetSchema,
  doughnut: DoughnutChartDatasetSchema,
  polarArea: PolarAreaChartDatasetSchema,
  radar: RadarChartDatasetSchema,
};

export function createChartDataDTOSchema<T extends ChartTypeLiteral>(type: T) {
  const DatasetSchema = datasetSchemaByType[type];
  const ChartDataSchemaTyped = z
    .object({
      labels: z.array(z.string()).optional(),
      datasets: z.array(DatasetSchema),
    })
    .strict();

  const ChartConfigurationSchemaTyped = z
    .object({
      type: z.literal(type),
      data: ChartDataSchemaTyped,
      options: z.record(z.string(), z.unknown()).optional(),
    })
    .strict();

  return z
    .object({
      query: z.string(),
      toolCallsUsed: z.number(),
      shortenedQuery: z.string(),
      dataset: ChartConfigurationSchemaTyped,
    })
    .strict();
}

export const AnyChartDataDTOSchema = z.union(
  CHART_TYPES.map((t) => createChartDataDTOSchema(t)) as unknown as [
    z.ZodTypeAny,
    ...z.ZodTypeAny[],
  ],
);

export type AnyChartDataDTO = z.infer<typeof AnyChartDataDTOSchema>;
