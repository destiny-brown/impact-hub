import path from "node:path";
import { performance } from "node:perf_hooks";
import {
  ensureDirectory,
  formatStatusBreakdown,
  parseArgs,
  parseEndpointTargets,
  readListFromArgs,
  readNumberOption,
  readStringOption,
  resolveOutputDirectory,
  summarizeLatencies,
  toCsvRow,
  writeJson,
  writeText,
  normalizeBaseUrl,
  round,
} from "./shared";

type RequestResult = {
  endpoint: string;
  latencyMs: number;
  status: string;
  ok: boolean;
  error?: string;
};

type AggregateSummary = {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  statusCounts: Record<string, number>;
  latencyMs: ReturnType<typeof summarizeLatencies>;
  throughputRps: number;
};

async function main() {
  const args = parseArgs();
  const targetApiUrl = normalizeBaseUrl(
    readStringOption(args, ["url", "target_api_url"], ["TARGET_API_URL"]) ?? "",
  );
  const totalRequests = readNumberOption(args, ["requests", "total_requests"], ["TOTAL_REQUESTS"], 100, 1);
  const concurrency = readNumberOption(args, ["concurrency"], ["CONCURRENCY"], 10, 1);
  const warmupRequests = readNumberOption(args, ["warmup", "warmup_requests"], ["WARMUP_REQUESTS"], 10, 0);
  const endpoints = parseEndpointTargets(
    readListFromArgs(args, "endpoint", "endpoints").length > 0
      ? readListFromArgs(args, "endpoint", "endpoints")
      : process.env.PERF_ENDPOINTS,
  );
  const outputDirectory = resolveOutputDirectory("benchmark");
  const resultsFilePath = path.join(outputDirectory, "benchmark-results.json");
  const csvFilePath = path.join(outputDirectory, "benchmark-results.csv");
  const summaryFilePath = path.join(outputDirectory, "benchmark-summary.md");

  await ensureDirectory(outputDirectory);

  console.log(`Running benchmark against ${targetApiUrl}`);
  console.log(`Endpoints: ${endpoints.map((endpoint) => endpoint.path).join(", ")}`);
  console.log(`Requests=${totalRequests} Concurrency=${concurrency} Warmup=${warmupRequests}`);

  if (warmupRequests > 0) {
    console.log(`Starting ${warmupRequests} warmup requests...`);
    await runRequests({
      baseUrl: targetApiUrl,
      endpoints,
      totalRequests: warmupRequests,
      concurrency: Math.min(concurrency, Math.max(1, warmupRequests)),
    });
  }

  const startedAt = performance.now();
  const requestResults = await runRequests({
    baseUrl: targetApiUrl,
    endpoints,
    totalRequests,
    concurrency: Math.min(concurrency, totalRequests),
  });
  const completedAt = performance.now();
  const durationMs = round(completedAt - startedAt);
  const durationSeconds = durationMs / 1000;
  const overallSummary = aggregateResults(requestResults, durationSeconds);
  const endpointSummaries = endpoints.map((endpoint) => {
    const endpointResults = requestResults.filter((result) => result.endpoint === endpoint.path);

    return {
      endpoint: endpoint.path,
      summary: aggregateResults(endpointResults, durationSeconds),
    };
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    config: {
      targetApiUrl,
      totalRequests,
      concurrency,
      warmupRequests,
      endpoints: endpoints.map((endpoint) => endpoint.path),
      outputDirectory,
    },
    durationMs,
    overall: overallSummary,
    endpoints: endpointSummaries,
    errorSamples: requestResults.filter((result) => !result.ok).slice(0, 20),
  };

  const csvRows = [
    toCsvRow([
      "scope",
      "total_requests",
      "success_count",
      "error_count",
      "avg_ms",
      "min_ms",
      "max_ms",
      "p50_ms",
      "p95_ms",
      "p99_ms",
      "throughput_rps",
      "status_breakdown",
    ]),
    toCsvRow([
      "overall",
      overallSummary.totalRequests,
      overallSummary.successCount,
      overallSummary.errorCount,
      overallSummary.latencyMs.avg,
      overallSummary.latencyMs.min,
      overallSummary.latencyMs.max,
      overallSummary.latencyMs.p50,
      overallSummary.latencyMs.p95,
      overallSummary.latencyMs.p99,
      overallSummary.throughputRps,
      formatStatusBreakdown(overallSummary.statusCounts),
    ]),
    ...endpointSummaries.map(({ endpoint, summary }) =>
      toCsvRow([
        endpoint,
        summary.totalRequests,
        summary.successCount,
        summary.errorCount,
        summary.latencyMs.avg,
        summary.latencyMs.min,
        summary.latencyMs.max,
        summary.latencyMs.p50,
        summary.latencyMs.p95,
        summary.latencyMs.p99,
        summary.throughputRps,
        formatStatusBreakdown(summary.statusCounts),
      ]),
    ),
  ].join("\n");

  const summaryMarkdown = [
    "# Performance benchmark summary",
    "",
    `- Generated at: ${payload.generatedAt}`,
    `- Target URL: ${targetApiUrl}`,
    `- Endpoints: ${endpoints.map((endpoint) => endpoint.path).join(", ")}`,
    `- Requests: ${totalRequests}`,
    `- Concurrency: ${concurrency}`,
    `- Warmup requests: ${warmupRequests}`,
    `- Duration: ${durationMs} ms`,
    "",
    "## Overall",
    "",
    "| avg ms | p95 ms | p99 ms | success | errors | statuses |",
    "| --- | --- | --- | --- | --- | --- |",
    `| ${overallSummary.latencyMs.avg} | ${overallSummary.latencyMs.p95} | ${overallSummary.latencyMs.p99} | ${overallSummary.successCount} | ${overallSummary.errorCount} | ${formatStatusBreakdown(overallSummary.statusCounts)} |`,
    "",
    "## Endpoint breakdown",
    "",
    "| endpoint | avg ms | p95 ms | p99 ms | success | errors | statuses |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...endpointSummaries.map(
      ({ endpoint, summary }) =>
        `| ${endpoint} | ${summary.latencyMs.avg} | ${summary.latencyMs.p95} | ${summary.latencyMs.p99} | ${summary.successCount} | ${summary.errorCount} | ${formatStatusBreakdown(summary.statusCounts)} |`,
    ),
    "",
    `Artifacts written to \`${outputDirectory}\`.`,
  ].join("\n");

  await Promise.all([
    writeJson(resultsFilePath, payload),
    writeText(csvFilePath, csvRows),
    writeText(summaryFilePath, summaryMarkdown),
  ]);

  console.log(summaryMarkdown);
}

async function runRequests({
  baseUrl,
  endpoints,
  totalRequests,
  concurrency,
}: {
  baseUrl: string;
  endpoints: { path: string }[];
  totalRequests: number;
  concurrency: number;
}) {
  let nextIndex = 0;
  const requestResults: RequestResult[] = [];

  async function worker() {
    while (nextIndex < totalRequests) {
      const requestIndex = nextIndex;
      nextIndex += 1;
      const endpoint = endpoints[requestIndex % endpoints.length];

      if (!endpoint) {
        break;
      }

      requestResults.push(await fetchEndpoint(baseUrl, endpoint.path));
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  return requestResults;
}

async function fetchEndpoint(baseUrl: string, endpoint: string): Promise<RequestResult> {
  const startedAt = performance.now();

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: "GET",
      headers: {
        "cache-control": "no-cache",
      },
    });

    await response.arrayBuffer();

    return {
      endpoint,
      latencyMs: round(performance.now() - startedAt),
      status: String(response.status),
      ok: response.ok,
    };
  } catch (error) {
    return {
      endpoint,
      latencyMs: round(performance.now() - startedAt),
      status: "NETWORK_ERROR",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function aggregateResults(requestResults: RequestResult[], durationSeconds: number): AggregateSummary {
  const statusCounts: Record<string, number> = {};
  const successCount = requestResults.filter((result) => result.ok).length;
  const errorCount = requestResults.length - successCount;

  for (const result of requestResults) {
    statusCounts[result.status] = (statusCounts[result.status] ?? 0) + 1;
  }

  return {
    totalRequests: requestResults.length,
    successCount,
    errorCount,
    statusCounts,
    latencyMs: summarizeLatencies(requestResults.map((result) => result.latencyMs)),
    throughputRps: durationSeconds > 0 ? round(requestResults.length / durationSeconds) : 0,
  };
}

main().catch((error) => {
  console.error("Benchmark failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
