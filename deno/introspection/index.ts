import fs from "fs-extra.ts";
import path from "path.ts";
import pluralize from "pluralize.ts";
import { sqlX } from "../SQLTag/sql.ts";
import { toCamelCase, toPascalCase, toSnakeCase } from "../common/casing.ts";
import { RequiredRefQLOptions } from "../common/types.ts";
import { getColumns, getRelationships, getTables } from "./queries.ts";
import sortObject from "../common/sortObj.ts";

/**
 * Generates a relation key name based on foreign key columns and related table name.
 * If an alias is provided, it is used directly as the relation key.
 *
 * @param tableName - Name of the related table (e.g. 'Team')
 * @param lRef - Array of foreign key column names (e.g. ['home_team_id'])
 * @param alias - Optional manual alias to override inference (e.g. 'home_team')
 * @returns A string to use as the property name for the related object (e.g. 'home_team')
 */
function getRelationKey(tableName: string, lRef: string[], alias?: string): string {
  if (alias) {
    return alias;
  }

  // to snake case and lower case to make it db casing independent
  const table = toSnakeCase (tableName).toLowerCase ();
  const normalizedLRefs = lRef.map (col => toSnakeCase (col).toLowerCase ());

  // Find columns that contain the table name
  const matchCols = normalizedLRefs.filter (col => col.includes (table));

  if (matchCols.length === 0) {
    // No column hints — just use the table name
    return table;
  }

  // Use the first matched column to extract a prefix
  const first = matchCols[0];

  // Strip off _<table>_id or <table>_id suffix
  const prefix = first.replace (new RegExp (`${table}(_)?id$`), "").replace (/_+$/, "");

  return prefix ? `${prefix}_${table}` : table;
}

function refsAsString(refs: string[]): string {
  return `[${'"' + refs.join ('", "') + '"'}]`;
}

const inRefqlEnv = process.env.NODE_ENV === "refql";
const prepath = inRefqlEnv ? "../.." : "refql/build";
const outputDir = inRefqlEnv ? "./src/generated/client" : path.resolve (process.cwd (), "node_modules/.refql/client");

const headerJs = [
  `"use strict";`,
  `var __importDefault = (this && this.__importDefault) || function (mod) {`,
  `  return (mod && mod.__esModule) ? mod : { default: mod };`,
  `};`,
  `Object.defineProperty (exports, "__esModule", { value: true });`,
  `exports.getTables = void 0;`,
  `const Prop_1 = __importDefault (require ("${prepath}/Prop"));`,
  `const BelongsTo_1 = __importDefault (require ("${prepath}/Prop/BelongsTo"));`,
  `const BelongsToMany_1 = __importDefault (require ("${prepath}/Prop/BelongsToMany"));`,
  `const BooleanProp_1 = __importDefault (require ("${prepath}/Prop/BooleanProp"));`,
  `const DateProp_1 = __importDefault (require ("${prepath}/Prop/DateProp"));`,
  `const HasMany_1 = __importDefault (require ("${prepath}/Prop/HasMany"));`,
  `const HasOne_1 = __importDefault (require ("${prepath}/Prop/HasOne"));`,
  `const NumberProp_1 = __importDefault (require ("${prepath}/Prop/NumberProp"));`,
  `const StringProp_1 = __importDefault (require ("${prepath}/Prop/StringProp"));`,
  "",
  "const getTables = Table => {",
  "  return {\n"
];


const headerTs = [
  `import Prop from "${prepath}/Prop/index.ts";`,
  `import PropType from "${prepath}/Prop/PropType.ts";`,
  `import RefProp from "${prepath}/Prop/RefProp.ts";`,
  `import { Table } from "${prepath}/Table/index.ts";`,
  'export declare const getTables: (Table: <TableId extends string, Props extends PropType<any>[]>(name: TableId, props: Props) => Table<TableId, { [P in Props[number] as P["as"]]: P; }>) => {\n'
];

const footerJs = [
  "\n  };",
  "};",
  "",
  "exports.getTables = getTables;"
];

export async function introspectPG(sql: typeof sqlX, options: RequiredRefQLOptions) {
  let outputJs = headerJs.join ("\n");
  let outputTs = headerTs.join ("\n");

  const schemas = await getTables (sql);

  const relationships = await getRelationships (sql).then (rels => rels.map (rel => ({
    ...rel,
    column_names: rel.column_names.replace (/^{|}$/g, "").split (","),
    foreign_column_names: rel.foreign_column_names.replace (/^{|}$/g, "").split (",")
  })));

  const schemaMap = await Promise.all (
    Object.keys (schemas).map (async schema => {
      const tables = schemas[schema];
      const interfacesNew = await Promise.all (

        tables.map (async ({ table_name: table, table_schema }) => {
          const tableName = toPascalCase (table);
          const columns = await getColumns (sql, table);
          const foreignKeys = relationships.filter (rel => rel.table_name === table);
          const reversedForeignKeys = relationships.filter (rel => rel.foreign_table_name === table);

          const intermediateForeignKeys = relationships
            .filter (rel => {
              const table1 = options.toCase (`${table}_${rel.foreign_table_name}`);
              const table2 = options.toCase (`${rel.foreign_table_name}_${table}`);
              return rel.table_name === table1 || rel.table_name === table2;
            })
            .map (rRel => {
              const lRel = relationships.find (rel => rel.table_name === rRel.table_name && rel.foreign_table_name === table);
              return [lRel, rRel];
            });

          const props: {[propertyName: string]: string[]} = {};

          for (const col of columns) {
            const propertyName = toCamelCase (col.column_name);
            const nullable = col.is_nullable === "YES";
            const hasDefault = col.column_default != null;

            const [propTypeJs, propTypeTs] = mapPostgresTypeToPropType (col.data_type, nullable);

            props[propertyName] = [
              `${propTypeJs} ("${propertyName}", "${col.column_name}")${hasDefault ? `.hasDefault ()` : nullable ? `.nullable ()` : ""}`,
              `${propertyName}: Prop<"${propertyName}", ${propTypeTs}, {}, false, ${hasDefault ? "true" : "false"}, false>;`
            ];
          }


          for (const fk of reversedForeignKeys) {
            const lRef = fk.foreign_column_names;
            const rRef = fk.column_names;

            if (fk.unique) {
              const propertyName = toCamelCase (fk.table_name);
              props[propertyName] = [
                `(0, HasOne_1.default) ("${propertyName}", "${fk.table_schema}.${fk.table_name}", { lRef: ${refsAsString (lRef)}, rRef: ${refsAsString (rRef)} })`,
                `${propertyName}: RefProp<"${propertyName}", "${fk.table_schema}.${fk.table_name}", "HasOne", false>;`
              ];

            } else {
              const propertyName = pluralize (toCamelCase (fk.table_name));
              props[propertyName] = [
                `(0, HasMany_1.default) ("${propertyName}", "${fk.table_schema}.${fk.table_name}", { lRef: ${refsAsString (lRef)}, rRef: ${refsAsString (rRef)} })`,
                `${propertyName}: RefProp<"${propertyName}", "${fk.table_schema}.${fk.table_name}", "HasMany", false>;`
              ];
            }
          }

          // after reversedKeys to overwrite possible false HasOne's
          for (const fk of foreignKeys) {
            const lRef = fk.column_names;
            const rRef = fk.foreign_column_names;

            const propertyName = toCamelCase (getRelationKey (fk.foreign_table_name, lRef));

            const cols = columns.filter (c => lRef.includes (c.column_name));

            if (cols.length === 0) continue;

            const nullable = cols.reduce ((acc, col) => acc || col.is_nullable === "YES", false) ;

            props[propertyName] = [
              `(0, BelongsTo_1.default) ("${propertyName}", "${fk.foreign_table_schema}.${fk.foreign_table_name}", { lRef: ${refsAsString (lRef)}, rRef: ${refsAsString (rRef)} })${nullable ? `.nullable ()` : ""}`,
              `${propertyName}: RefProp<"${propertyName}", "${fk.foreign_table_schema}.${fk.foreign_table_name}", "BelongsTo", ${nullable ? "true" : "false"}>;`
            ];
          }

          for (const fk of intermediateForeignKeys) {
            const [lRel, rRel] = fk;
            if (!lRel || !rRel) continue;
            const lRef = lRel.foreign_column_names;
            const lxRef = lRel.column_names;
            const xTable = `${lRel.table_schema}.${lRel.table_name}`;
            const rxRef = rRel.column_names;
            const rRef = rRel.foreign_column_names;

            const propertyName = pluralize (toCamelCase (rRel.foreign_table_name));

            props[propertyName] = [
              `(0, BelongsToMany_1.default) ("${propertyName}", "${rRel.foreign_table_schema}.${rRel.foreign_table_name}", { lRef: ${refsAsString (lRef)}, lxRef: ${refsAsString (lxRef)}, xTable: "${xTable}", rxRef: ${refsAsString (rxRef)}, rRef: ${refsAsString (rRef)} })`,
              `${propertyName}: RefProp<"${propertyName}", "${rRel.foreign_table_schema}.${rRel.foreign_table_name}", "BelongsToMany", false>;`
            ];
          }

          const interfaceProperties = Object.values (sortObject (props)) as string[][];

          return [
            `      ${tableName}: Table ("${table_schema}.${table}", [\n        ${interfaceProperties.map (([js]) => js).join (",\n        ")}\n      ])`,
            `    ${tableName}: Table<"${table_schema}.${table}", {\n      ${interfaceProperties.map (([_js, ts]) => ts).join ("\n      ")}\n    }>;`
          ];
        }));

      const schemaContent = [
        `    ${schema}: {\n${interfacesNew.map (([js]) => js).join (",\n")}\n    }`,
        `  ${schema}: {\n${interfacesNew.map (([_js, ts]) => ts).join ("\n")}\n  };`
      ];

      return schemaContent;
    })
  );

  outputJs += schemaMap.map (([js]) => js).join (",\n");
  outputTs += schemaMap.map (([_js, ts]) => ts).join ("\n");

  // footer
  outputJs += footerJs.join ("\n");
  outputTs += "\n};";


  return [outputJs, outputTs];
}

function mapPostgresTypeToPropType(pgType: string, nullable: boolean): string[] {
  const mapTo = () => {
    switch (pgType) {
      case "integer":
      case "bigint":
        return ["(0, NumberProp_1.default)", "number"];
      case "text":
      case "varchar":
      case "character varying":
        return ["(0, StringProp_1.default)", "string"];
      case "boolean":
        return ["(0, BooleanProp_1.default)", "boolean"];
      case "timestamp without time zone":
      case "timestamp with time zone":
      case "date":
        return ["(0, DateProp_1.default)", "Date"];
      default:
        return ["(0, Prop_1.default)", "any"];
    }
  };

  const mapped = mapTo ();

  return [mapped[0], nullable ? `${mapped[1]} | null` : mapped[1]];
}

async function introspect(sql: typeof sqlX, options: RequiredRefQLOptions) {
  const outputJsFile = `${outputDir}/index.js`;
  const outputTsFile = `${outputDir}/index.d.ts`;
  const originalJs = fs.readFileSync (outputJsFile, "utf-8");
  const originalTs = fs.readFileSync (outputTsFile, "utf-8");

  try {
    const [outputJs, outputTs] = await introspectPG (sql, options);
    await fs.outputFile (outputJsFile, outputJs);
    await fs.outputFile (outputTsFile, outputTs);
    console.log ("RefQL introspect completed!");
  } catch (e) {
    await fs.outputFile (outputJsFile, originalJs);
    await fs.outputFile (outputTsFile, originalTs);
    console.error (`RefQL introspect failed!`);
  }
}

export default introspect;