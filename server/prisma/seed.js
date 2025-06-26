const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  const goals = [
    "Lose weight",
    "Gain weight",
    "Health & Longevity",
    "Muscle Strengthening",
  ];
  for (const name of goals) {
    await db.fitnessGoal.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
