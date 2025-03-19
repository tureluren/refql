import { generateInterfaces } from "./introspect.ts";

(async () => {
  const outputDir = "./src/generated";
  await generateInterfaces (outputDir);
}) ();