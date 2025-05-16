import * as fs from "fs-extra";
import pluralize from "pluralize";
import { getColumns, getOneToOneRelationships, getRelationships, getTables } from "./queries";

function toCamelCase(str: string): string {
  return str
    .toLowerCase ()
    .replace (/(?:[_\-\s]+([a-z]))|^[A-Z]/g, (_, letter, offset) =>
      offset === 0 ? str.charAt (0).toLowerCase () : (letter ? letter.toUpperCase () : "")
    );
}

function toPascalCase(str: string): string {
  const camel = toCamelCase (str);
  return camel.charAt (0).toUpperCase () + camel.slice (1);
}

function toSnakeCase(str: string): string {
  return str
    .replace (/([a-z])([A-Z])/g, "$1_$2")
    .replace (/[-\s]+/g, "_")
    .toLowerCase ();
}

function toKebabCase(str: string): string {
  return str
    .replace (/([a-z])([A-Z])/g, "$1-$2")
    .replace (/[_\s]+/g, "-")
    .toLowerCase ();
}


const headerJs = [
  `"use strict";`,
  `var __importDefault = (this && this.__importDefault) || function (mod) {`,
  `  return (mod && mod.__esModule) ? mod : { default: mod };`,
  `};`,
  `Object.defineProperty (exports, "__esModule", { value: true });`,
  `exports.getTables = void 0;`,
  `const Prop_1 = __importDefault (require ("../Prop"));`,
  `const BelongsTo_1 = __importDefault (require ("../Prop/BelongsTo"));`,
  `const BelongsToMany_1 = __importDefault (require ("../Prop/BelongsToMany"));`,
  `const BooleanProp_1 = __importDefault (require ("../Prop/BooleanProp"));`,
  `const DateProp_1 = __importDefault (require ("../Prop/DateProp"));`,
  `const HasMany_1 = __importDefault (require ("../Prop/HasMany"));`,
  `const HasOne_1 = __importDefault (require ("../Prop/HasOne"));`,
  `const NumberProp_1 = __importDefault (require ("../Prop/NumberProp"));`,
  `const StringProp_1 = __importDefault (require ("../Prop/StringProp"));`,
  "",
  "const getTables = Table => {",
  "  return {\n"
];


const headerTs = [
  'import Prop from "../Prop";',
  'import PropType from "../Prop/PropType";',
  'import RefProp from "../Prop/RefProp";',
  'import { Table } from "../Table";',
  'export declare const getTables: (Table: <TableId extends string, Props extends PropType<any>[]>(name: TableId, props: Props) => Table<TableId, { [P in Props[number] as P["as"]]: P; }>) => {\n'
];

const footerJs = [
  "\n  };",
  "};",
  "",
  "exports.getTables = getTables;"
];


// ENKEL PUBLIC ??
export async function generateInterfaces(outputDir: string) {
  const outputJs = `${outputDir}/tables.js`;
  const outputTs = `${outputDir}/tables.ts`;

  // header
  await fs.outputFile (outputJs, headerJs.join ("\n"));
  await fs.outputFile (outputTs, headerTs.join ("\n"));

  const schemas = await getTables ();

  const relationships = await getRelationships ().then (rels => rels.map (rel => ({
    ...rel,
    column_names: rel.column_names.replace (/^{|}$/g, "").split (","),
    foreign_column_names: rel.foreign_column_names.replace (/^{|}$/g, "").split (",")
  })));

  const uniqueKeys = await getOneToOneRelationships ();

  const schemaMap = await Promise.all (
    Object.keys (schemas).map (async schema => {
      const tables = schemas[schema];
      const interfacesNew = await Promise.all (

        tables.map (async ({ table_name: table, table_schema }) => {
          const tableName = toPascalCase (table);
          const columns = await getColumns (table);
          const foreignKeys = relationships.filter (rel => rel.table_name === table);
          const reversedForeignKeys = relationships.filter (rel => rel.foreign_table_name === table);

          const intermediateForeignKeys = relationships
            .filter (rel => {
              const table1 = `${table}_${rel.foreign_table_name}`;
              const table2 = `${rel.foreign_table_name}_${table}`;
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

          for (const fk of foreignKeys) {
            const lRef = fk.column_names[0];
            const rRef = fk.foreign_column_names[0];

            // homeTeamId -> homeTeam
            const propertyName = toCamelCase (lRef).replace (`${toPascalCase (rRef)}`, "");

            const col = columns.find (c => c.column_name === lRef);
            const nullable = col.is_nullable === "YES";

            props[propertyName] = [
              `(0, BelongsTo_1.default) ("${propertyName}", "${fk.foreign_table_schema}.${fk.foreign_table_name}", { lRef: "${lRef}", rRef: "${rRef}" })${nullable ? `.nullable ()` : ""}`,
              `${propertyName}: RefProp<"${propertyName}", "${fk.foreign_table_schema}.${fk.foreign_table_name}", "BelongsTo", ${nullable ? "true" : "false"}>;`
            ];
          }

          for (const fk of reversedForeignKeys) {
            const ufk = uniqueKeys.find (uk => uk.fk_name === fk.constraint_name);
            const lRef = fk.foreign_column_names[0];
            const rRef = fk.column_names[0];

            if (ufk) {
              const propertyName = toCamelCase (fk.table_name);
              props[propertyName] = [
                `(0, HasOne_1.default) ("${propertyName}", "${fk.table_schema}.${fk.table_name}", { lRef: "${lRef}", rRef: "${rRef}" })`,
                `${propertyName}: RefProp<"${propertyName}", "${fk.table_schema}.${fk.table_name}", "HasOne", false>;`
              ];

            } else {
              const propertyName = pluralize (toCamelCase (fk.table_name));
              props[propertyName] = [
                `(0, HasMany_1.default) ("${propertyName}", "${fk.table_schema}.${fk.table_name}", { lRef: "${lRef}", rRef: "${rRef}" })`,
                `${propertyName}: RefProp<"${propertyName}", "${fk.table_schema}.${fk.table_name}", "HasMany", false>;`
              ];
            }
          }

          for (const fk of intermediateForeignKeys) {
            const [lRel, rRel] = fk;
            const lRef = lRel.foreign_column_names[0];
            const lxRef = lRel.column_names[0];
            const xTable = `${lRel.table_schema}.${lRel.table_name}`;
            const rxRef = rRel.column_names[0];
            const rRef = rRel.foreign_column_names[0];

            const propertyName = pluralize (toCamelCase (rRel.foreign_table_name));

            props[propertyName] = [
              `(0, BelongsToMany_1.default) ("${propertyName}", "${rRel.foreign_table_schema}.${rRel.foreign_table_name}", { lRef: "${lRef}", lxRef: "${lxRef}", xTable: "${xTable}", rxRef: "${rxRef}", rRef: "${rRef}" })`,
              `${propertyName}: RefProp<"${propertyName}", "${rRel.foreign_table_schema}.${rRel.foreign_table_name}", "BelongsToMany", false>;`
            ];
          }

          const interfaceProperties = Object.values (props);

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

  await fs.appendFile (outputJs, schemaMap.map (([js]) => js).join (",\n"));
  await fs.appendFile (outputTs, schemaMap.map (([_js, ts]) => ts).join ("\n"));

  // footer
  await fs.appendFile (outputJs, footerJs.join ("\n"));
  await fs.appendFile (outputTs, "\n};");

  console.log ("RefQL schema generated successfully!");
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

