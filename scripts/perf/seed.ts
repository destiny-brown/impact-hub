import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {
  assertSafeMutatingTargets,
  ensureDirectory,
  parseArgs,
  readBooleanOption,
  readNumberOption,
  readStringOption,
  resolveOutputDirectory,
  writeJson,
  writeText,
} from "./shared";

async function main() {
  const args = parseArgs();
  const targetApiUrl = readStringOption(args, ["url", "target_api_url"], ["TARGET_API_URL"]);
  const databaseUrl = readStringOption(args, ["db_url", "database_url"], ["PERF_DATABASE_URL", "DATABASE_URL"]);
  const seedCount = readNumberOption(args, ["seed_count"], ["SEED_COUNT"], 250, 1);
  const allowProd = readBooleanOption(args, ["allow_prod"], ["ALLOW_PROD"], false);
  const eventCount = readNumberOption(
    args,
    ["event_count"],
    ["SEED_EVENT_COUNT"],
    Math.min(10, Math.max(1, Math.ceil(seedCount / 100))),
    1,
  );

  if (!databaseUrl) {
    throw new Error("PERF_DATABASE_URL (or DATABASE_URL) is required for perf seeding");
  }

  assertSafeMutatingTargets(targetApiUrl, databaseUrl, allowProd);

  const outputDirectory = resolveOutputDirectory("seed");
  const resultsFilePath = path.join(outputDirectory, "seed-results.json");
  const summaryFilePath = path.join(outputDirectory, "seed-summary.md");

  await ensureDirectory(outputDirectory);

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });
  const now = new Date();
  const eventIds: string[] = [];

  try {
    console.log(`Seeding ${seedCount} volunteers/requests across ${eventCount} events`);

    for (let index = 0; index < eventCount; index += 1) {
      const event = await prisma.event.upsert({
        where: { slug: `perf-event-${index + 1}` },
        update: {
          title: `Performance Benchmark Event ${index + 1}`,
          description: "Seeded event for staging-safe performance benchmarks.",
          location: "Staging Environment",
          date: new Date(now.getTime() + (index + 1) * 86_400_000),
          capacity: Math.max(seedCount + 25, 100),
        },
        create: {
          slug: `perf-event-${index + 1}`,
          title: `Performance Benchmark Event ${index + 1}`,
          description: "Seeded event for staging-safe performance benchmarks.",
          location: "Staging Environment",
          date: new Date(now.getTime() + (index + 1) * 86_400_000),
          capacity: Math.max(seedCount + 25, 100),
        },
      });

      eventIds.push(event.id);
    }

    const volunteers = Array.from({ length: seedCount }, (_, index) => ({
      email: `perf-volunteer-${index + 1}@example.test`,
      fullName: `Performance Volunteer ${index + 1}`,
      phone: `555-010-${String(index + 1).padStart(4, "0")}`,
      location: "Staging",
      bio: "Seeded volunteer for repeatable perf benchmarks.",
    }));

    const createdVolunteers = await prisma.volunteer.createMany({
      data: volunteers,
      skipDuplicates: true,
    });

    const storedVolunteers = await prisma.volunteer.findMany({
      where: {
        email: {
          in: volunteers.map((volunteer) => volunteer.email),
        },
      },
      select: {
        id: true,
        email: true,
      },
      orderBy: {
        email: "asc",
      },
    });

    const requests = storedVolunteers.map((volunteer, index) => {
      const status = ["PENDING", "APPROVED", "REJECTED"][index % 3] as "PENDING" | "APPROVED" | "REJECTED";
      const approvedAt = status === "PENDING" ? null : now;
      const approvedBy = status === "PENDING" ? null : "perf-benchmark-seed";

      return {
        volunteerId: volunteer.id,
        eventId: eventIds[index % eventIds.length] ?? eventIds[0]!,
        message: `Seeded perf request ${index + 1}`,
        status,
        approvedAt,
        approvedBy,
      };
    });

    const createdRequests = await prisma.volunteerRequest.createMany({
      data: requests,
      skipDuplicates: true,
    });

    const payload = {
      generatedAt: now.toISOString(),
      targetApiUrl: targetApiUrl ?? null,
      outputDirectory,
      seedCount,
      eventCount,
      createdVolunteers: createdVolunteers.count,
      totalVolunteersMatched: storedVolunteers.length,
      createdRequests: createdRequests.count,
      notes: [
        "Seeding is idempotent via unique volunteer email values and the VolunteerRequest unique constraint on (volunteerId, eventId).",
        "Mutating operations refuse production-like targets unless ALLOW_PROD=true is explicitly provided.",
      ],
    };

    const summaryMarkdown = [
      "# Performance seed summary",
      "",
      `- Generated at: ${payload.generatedAt}`,
      `- Seed count requested: ${seedCount}`,
      `- Events ensured: ${eventCount}`,
      `- Volunteers inserted this run: ${createdVolunteers.count}`,
      `- Volunteers available for benchmarking: ${storedVolunteers.length}`,
      `- Requests inserted this run: ${createdRequests.count}`,
      "",
      "The seed data uses deterministic emails plus the existing `@@unique([volunteerId, eventId])` constraint so repeated runs avoid duplicate-request growth.",
    ].join("\n");

    await Promise.all([writeJson(resultsFilePath, payload), writeText(summaryFilePath, summaryMarkdown)]);

    console.log(summaryMarkdown);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Perf seed failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
