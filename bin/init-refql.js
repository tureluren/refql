const fs = require ("fs");
const path = require ("path");

const clientDir = path.join (__dirname, "../../.refql/client");

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

  console.log (".refql/client created in node_modules");
}
