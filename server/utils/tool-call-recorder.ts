import { AsyncLocalStorage } from "node:async_hooks";
import { createMiddleware } from "langchain";
import type { ToolCallCountStore } from "./tool-call-recorder.interface";

const toolCallStorage = new AsyncLocalStorage<ToolCallCountStore>();

export const toolCallRecorder = createMiddleware({
  name: "toolCallRecorder",
  wrapToolCall: async (request, handler) => {
    const store = toolCallStorage.getStore();
    if (store) {
      store.count += 1;
    }
    return handler(request);
  },
});

export async function runWithToolCallCounting<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; toolCallsUsed: number }> {
  const store: ToolCallCountStore = { count: 0 };
  const result = await toolCallStorage.run(store, fn);
  return { result, toolCallsUsed: store.count };
}
