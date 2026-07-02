import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

function main() {
  const outputDirectory =
    process.env.PERF_OUTPUT_DIR?.trim() ||
    path.join(
      "perf-results",
      `run-${new Date().toISOString().replace(/[:.]/g, "-")}`
    );

  const environment = {
    ...process.env,
    PERF_OUTPUT_DIR: outputDirectory,
  };

  const runSeed = /^(1|true|yes|on)$/i.test(
    process.env.RUN_SEED ?? "false"
  );

  // Ensure output folder exists EARLY (important)
  fs.mkdirSync(outputDirectory, { recursive: true });

  if (runSeed) {
    runScript("perf:seed", environment);
  }

  runScript("perf:bench", environment);

  // After benchmark finishes → read results
  const resultsPath = path.join(outputDirectory, "benchmark-results.json");

  if (!fs.existsSync(resultsPath)) {
    console.error("No benchmark-results.json found — benchmark did not output results");
    process.exit(1);
  }

  const stats = JSON.parse(fs.readFileSync(resultsPath, "utf-8"));
  const overall = stats.overall;

  console.log("Summary written to:", outputDirectory);

  // ==========================
  // CI/CD GATEKEEPER LOGIC
  //  ==========================

  const P95_THRESHOLD = 600;
  const MAX_ERRORS = 0;

  if (overall.latencyMs.p95 > P95_THRESHOLD) {
    console.error(`p95 too high: ${overall.latencyMs.p95}ms`);
    process.exit(1);
  }

  if (overall.errorCount > MAX_ERRORS) {
    console.error(`errors detected: ${overall.errorCount}`);
    process.exit(1);
  }

  console.log("Performance within acceptable limits");
}

function runScript(scriptName: string, environment: NodeJS.ProcessEnv) {
  const command = process.platform === "win32" ? "npm.cmd" : "npm";

  const result = spawnSync(command, ["run", scriptName], {
    stdio: "inherit",
    env: environment,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

main();
