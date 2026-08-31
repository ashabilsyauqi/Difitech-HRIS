const { execSync } = require("child_process");

try {
  const commits = execSync("git log --oneline -n 30 -- prisma/dev.db").toString().trim().split("\n");
  console.log("Commits that touched dev.db:\n", commits.join("\n"));
} catch (e) {
  console.error(e);
}
