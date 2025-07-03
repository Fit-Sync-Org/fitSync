const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const goals = [
    "LOSE_WEIGHT",
    "GAIN_WEIGHT",
    "BUILD_MUSCLE",
    "TONE_AND_STRENGTHEN",
    "MAINTAIN_WEIGHT",
    "EAT_HEALTHY",
    "HEALTH_AND_LONGEVITY",
    "MANAGE_STRESS_AND_RECOVERY"
  ];

  for (const goal of goals) {
    await db.fitnessGoal.upsert({
      where: { name: goal },
      update: {},
      create: { name: goal },
    });
  }
  console.log("Seeding complete");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
