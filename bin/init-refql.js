const fs = require ("fs");
const path = require ("path");

const clientDir = path.join (__dirname, "../../.refql/client");

// hm-js sidecar placeholder — `Tables` MUST be declared in exactly one
// sidecar (refql.hm + client/index.hm are merged; repeated top-level
// declarations act as overloads/unions in hm-js).  `introspect()`
// overwrites this file with the concrete schema record.
const hmPlaceholder = [
  "// AUTO-GENERATED placeholder — run your project's `introspect()` call to",
  "// replace this with the concrete `Tables` schema of your database.",
  "::types refql",
  "",
  "// Polymorphic default — refined by introspect.",
  "Tables :: a",
  ""
].join ("\n");

// Only proceed if clientDir does not exist
if (!fs.existsSync (clientDir)) {
  // Create the directory recursively
  fs.mkdirSync (clientDir, { recursive: true });

  // Create package.json
  const packageJsonContent = {
    name: ".refql/client",
    main: "index.js",
    types: "index.d.ts"
  };

  fs.writeFileSync (
    path.join (clientDir, "package.json"),
    JSON.stringify (packageJsonContent, null, 2)
  );

  const readFromTxt = fileName => {
    const filePath = path.join (__dirname, fileName);
    return fs.readFileSync (filePath, "utf-8");
  };

  const indexJsContent = readFromTxt ("index.js.txt");
  fs.writeFileSync (path.join (clientDir, "index.js"), indexJsContent);

  const indexDtsContent = readFromTxt ("index.d.ts.txt");
  fs.writeFileSync (path.join (clientDir, "index.d.ts"), indexDtsContent);

  fs.writeFileSync (path.join (clientDir, "index.hm"), hmPlaceholder);

  console.log (".refql/client created in node_modules");
}

// Upgrade path: seed the hm-js sidecar placeholder when the client dir
// predates .hm support (never overwrite an introspected index.hm).
if (!fs.existsSync (path.join (clientDir, "index.hm"))) {
  fs.writeFileSync (path.join (clientDir, "index.hm"), hmPlaceholder);
  console.log (".refql/client/index.hm placeholder created");
}
