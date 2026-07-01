import fs from "node:fs/promises";
import path from "node:path";

type ParsedArgs = Map<string, string[]>;

const SAFE_HOST_HINTS = ["localhost", "127.0.0.1", "preview", "staging", "stage", "dev", "test", "qa"];
const PROD_HOST_HINTS = ["production", "prod"];
const KNOWN_PRODUCTION_HOSTS = ["impact-hub-hazel.vercel.app"];

export type EndpointTarget = {
  path: string;
  label: string;
};

export type LatencyStats = {
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
};

export function parseArgs(argv = process.argv.slice(2)) {
  const parsedArgs: ParsedArgs = new Map();

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (!arg?.startsWith("--")) {
      continue;
    }

    const trimmed = arg.slice(2);
    const [rawKey, inlineValue] = trimmed.split("=", 2);
    const key = normalizeArgKey(rawKey);

    let value = inlineValue;

    if (value === undefined && argv[index + 1] && !argv[index + 1].startsWith("--")) {
      value = argv[index + 1];
      index += 1;
    }

    const values = parsedArgs.get(key) ?? [];
    values.push(value ?? "true");
    parsedArgs.set(key, values);
  }

  return parsedArgs;
}

function normalizeArgKey(value: string) {
  return value.trim().replace(/-/g, "_").toLowerCase();
}

function readFromArgs(args: ParsedArgs, ...keys: string[]) {
  for (const key of keys) {
    const values = args.get(normalizeArgKey(key));

    if (values && values.length > 0) {
      return values[values.length - 1];
    }
  }

  return undefined;
}

export function readListFromArgs(args: ParsedArgs, ...keys: string[]) {
  for (const key of keys) {
    const values = args.get(normalizeArgKey(key));

    if (values && values.length > 0) {
      return values;
    }
  }

  return [];
}

export function readStringOption(args: ParsedArgs, argKeys: string[], envKeys: string[], fallback?: string) {
  const argValue = readFromArgs(args, ...argKeys);

  if (argValue) {
    return argValue;
  }

  for (const envKey of envKeys) {
    const envValue = process.env[envKey]?.trim();

    if (envValue) {
      return envValue;
    }
  }

  return fallback;
}

export function readNumberOption(
  args: ParsedArgs,
  argKeys: string[],
  envKeys: string[],
  fallback: number,
  minimum = 0,
) {
  const rawValue = readStringOption(args, argKeys, envKeys);

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsedValue) || parsedValue < minimum) {
    throw new Error(`Invalid numeric value "${rawValue}" for ${argKeys[0] ?? envKeys[0]}`);
  }

  return parsedValue;
}

export function readBooleanOption(args: ParsedArgs, argKeys: string[], envKeys: string[], fallback = false) {
  const rawValue = readStringOption(args, argKeys, envKeys);

  if (!rawValue) {
    return fallback;
  }

  return /^(1|true|yes|on)$/i.test(rawValue);
}

export function normalizeBaseUrl(url: string) {
  try {
    const normalized = new URL(url.trim());

    return normalized.toString().replace(/\/$/, "");
  } catch {
    throw new Error(`Invalid TARGET_API_URL: ${url}`);
  }
}

export function parseEndpointTargets(values: string[] | string | undefined) {
  const rawTargets = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? values.split(",")
      : [];

  const targets = rawTargets
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      const pathValue = value.startsWith("/") ? value : `/${value}`;

      return {
        path: pathValue,
        label: pathValue,
      };
    });

  if (targets.length > 0) {
    return targets;
  }

  return [
    { path: "/api/events", label: "/api/events" },
    { path: "/api/activity", label: "/api/activity" },
  ] satisfies EndpointTarget[];
}

export function resolveOutputDirectory(prefix: string) {
  const configured = process.env.PERF_OUTPUT_DIR?.trim();
  const fallbackName = `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}`;

  return path.resolve(process.cwd(), configured || path.join("perf-results", fallbackName));
}

export async function ensureDirectory(directoryPath: string) {
  await fs.mkdir(directoryPath, { recursive: true });
}

export async function writeJson(filePath: string, value: unknown) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function writeText(filePath: string, value: string) {
  await fs.writeFile(filePath, value.endsWith("\n") ? value : `${value}\n`, "utf8");
}

export function summarizeLatencies(latencies: number[]): LatencyStats {
  if (latencies.length === 0) {
    return {
      avg: 0,
      min: 0,
      max: 0,
      p50: 0,
      p95: 0,
      p99: 0,
    };
  }

  const sorted = [...latencies].sort((left, right) => left - right);
  const total = latencies.reduce((sum, latency) => sum + latency, 0);

  return {
    avg: round(total / latencies.length),
    min: round(sorted[0] ?? 0),
    max: round(sorted[sorted.length - 1] ?? 0),
    p50: round(percentile(sorted, 50)),
    p95: round(percentile(sorted, 95)),
    p99: round(percentile(sorted, 99)),
  };
}

function percentile(sortedLatencies: number[], percentileValue: number) {
  if (sortedLatencies.length === 0) {
    return 0;
  }

  const index = Math.min(
    sortedLatencies.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sortedLatencies.length) - 1),
  );

  return sortedLatencies[index] ?? 0;
}

export function round(value: number) {
  return Number(value.toFixed(2));
}

export function formatStatusBreakdown(statusCounts: Record<string, number>) {
  const entries = Object.entries(statusCounts).sort(([left], [right]) => left.localeCompare(right));

  if (entries.length === 0) {
    return "-";
  }

  return entries.map(([status, count]) => `${status}: ${count}`).join(", ");
}

export function toCsvRow(columns: Array<string | number>) {
  return columns
    .map((value) => {
      const serialized = String(value);

      if (serialized.includes(",") || serialized.includes("\"") || serialized.includes("\n")) {
        return `"${serialized.replaceAll("\"", "\"\"")}"`;
      }

      return serialized;
    })
    .join(",");
}

export function looksLikeProductionUrl(value: string) {
  try {
    const hostname = new URL(value).hostname.toLowerCase();

    if (KNOWN_PRODUCTION_HOSTS.includes(hostname)) {
      return true;
    }

    const hasSafeHint = SAFE_HOST_HINTS.some((hint) => hostname.includes(hint));
    const hasProdHint = PROD_HOST_HINTS.some((hint) => hostname.includes(hint));

    if (hasProdHint && !hasSafeHint) {
      return true;
    }

    if (hostname.endsWith(".vercel.app") && !hostname.includes("-git-") && !hasSafeHint) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

export function assertSafeMutatingTargets(targetApiUrl: string | undefined, databaseUrl: string, allowProd: boolean) {
  if (allowProd) {
    return;
  }

  const flaggedValues = [targetApiUrl, databaseUrl].filter((value): value is string => Boolean(value)).filter(looksLikeProductionUrl);

  if (flaggedValues.length > 0) {
    throw new Error(
      `Refusing to run mutating perf seed against production-like target(s): ${flaggedValues.join(", ")}. Set ALLOW_PROD=true only for an intentional override.`,
    );
  }
}
