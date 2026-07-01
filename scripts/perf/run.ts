import path from "node:path";
import { spawnSync } from "node:child_process";

function main() {
  const outputDirectory =
    process.env.PERF_OUTPUT_DIR?.trim() ||
    path.join("perf-results", `run-${new Date().toISOString().replace(/[:.]/g, "-")}`);
  const environment = {
    ...process.env,
    PERF_OUTPUT_DIR: outputDirectory,
  };
  const runSeed = /^(1|true|yes|on)$/i.test(process.env.RUN_SEED ?? "false");

  if (runSeed) {
    runScript("perf:seed", environment);
  }

  runScript("perf:bench", environment);

  console.log(`Performance artifacts available in ${outputDirectory}`);
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
