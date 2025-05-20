const fs = require ("fs");
const path = require ("path");

const clientDir = path.join (__dirname, "../../.refql/client");

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

// Create index.js
const indexJsContent = `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTables = void 0;

const getTables = _Table => {
  return {};
};

exports.getTables = getTables;
`;

fs.writeFileSync (path.join (clientDir, "index.js"), indexJsContent);

// Create index.d.ts
const indexDtsContent = `import PropType from "refql/build/Prop/PropType";
import { Table } from "refql/build/Table";

export declare const getTables: (Table: <TableId extends string, Props extends PropType<any>[]>(
  name: TableId,
  props: Props
) => Table<TableId, { [P in Props[number] as P["as"]]: P; }>) => {
};
`;

fs.writeFileSync (path.join (clientDir, "index.d.ts"), indexDtsContent);

console.log (".refql/client created in node_modules");
