import { generateInterfaces } from "./introspect";

(async () => {
  const outputDir = "./generated";
  await generateInterfaces (outputDir);
}) ();