const fs = require("fs");
const path = require("path");

function inspect() {
  const prismaDir = path.join(process.cwd(), "prisma");
  console.log("Files in prisma dir:", fs.readdirSync(prismaDir));
}

inspect();
