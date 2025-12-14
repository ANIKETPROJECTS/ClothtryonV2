import { build as viteBuild } from "vite";
import { rm, cp, mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";

async function buildNetlify() {
  await rm("dist", { recursive: true, force: true });

  console.log("Building frontend for Netlify...");
  await viteBuild({
    build: {
      outDir: "dist/public",
    },
  });

  console.log("Copying static assets...");
  if (existsSync("attached_assets")) {
    await mkdir("dist/public/attached_assets", { recursive: true });
    await cp("attached_assets", "dist/public/attached_assets", { recursive: true });
  }

  console.log("Creating _redirects file...");
  const redirects = `/api/*  /.netlify/functions/api/:splat  200
/*  /index.html  200`;
  await writeFile("dist/public/_redirects", redirects);

  console.log("Netlify build complete!");
}

buildNetlify().catch((err) => {
  console.error(err);
  process.exit(1);
});
