import { generateInterfaces } from "./introspect";

(async () => {
  const outputDir = "./src/generated";
  await generateInterfaces (outputDir);
}) ();