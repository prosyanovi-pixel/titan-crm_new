import { z } from "zod";
import { moduleReferenceSeeds } from "../src/modules/registry/referenceSeeds.js";

const quickActionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().min(1),
  action: z.string().min(1),
  displayOrder: z.number().int().positive(),
});

const moduleSeedSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().min(1),
  displayOrder: z.number().int().positive(),
  quickActions: z.array(quickActionSchema).optional(),
});

const seedsSchema = z.array(moduleSeedSchema).min(1);

const ensureUnique = (items, keyGetter, errorPrefix) => {
  const seen = new Map();
  const duplicates = [];

  for (const item of items) {
    const key = keyGetter(item);
    if (seen.has(key)) {
      duplicates.push(key);
    } else {
      seen.set(key, true);
    }
  }

  if (duplicates.length > 0) {
    throw new Error(`${errorPrefix}: ${[...new Set(duplicates)].join(", ")}`);
  }
};

const run = () => {
  const parsed = seedsSchema.safeParse(moduleReferenceSeeds);
  if (!parsed.success) {
    console.error("[module-seeds] Schema validation failed");
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
  }

  const seeds = parsed.data;

  ensureUnique(seeds, (seed) => seed.id, "Duplicate module ids");
  ensureUnique(seeds, (seed) => seed.displayOrder, "Duplicate module displayOrder values");

  for (const seed of seeds) {
    if (!seed.quickActions || seed.quickActions.length === 0) continue;

    ensureUnique(
      seed.quickActions,
      (quickAction) => quickAction.id,
      `Duplicate quick action ids in module ${seed.id}`
    );

    ensureUnique(
      seed.quickActions,
      (quickAction) => quickAction.displayOrder,
      `Duplicate quick action displayOrder values in module ${seed.id}`
    );
  }

  console.log(`[module-seeds] validation passed (${seeds.length} modules)`);
};

try {
  run();
} catch (error) {
  console.error(`[module-seeds] validation failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
