import * as fs from "fs-extra.ts";
import pluralize from "pluralize.ts";
import { getColumns, getOneToOneRelationships, getRelationships, getTables } from "./queries.ts";

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


const imports = [
  'import Prop from "../Prop/index.ts";',
  'import BelongsTo from "../Prop/BelongsTo.ts";',
  'import BelongsToMany from "../Prop/BelongsToMany.ts";',
  'import BooleanProp from "../Prop/BooleanProp.ts";',
  'import DateProp from "../Prop/DateProp.ts";',
  'import HasMany from "../Prop/HasMany.ts";',
  'import HasOne from "../Prop/HasOne.ts";',
  'import NumberProp from "../Prop/NumberProp.ts";',
  'import StringProp from "../Prop/StringProp.ts";',
  'import Table from "../Table/index.ts";'
];

export async function generateInterfaces(outputDir: string) {
  // imports
  await fs.outputFile (`${outputDir}/tables.ts`, `${imports.join ("\n")}\n\n`);

  const tables = await getTables ();
  const relationships = await getRelationships ().then (rels => rels.map (rel => ({
    ...rel,
    column_names: rel.column_names.replace (/^{|}$/g, "").split (","),
    foreign_column_names: rel.foreign_column_names.replace (/^{|}$/g, "").split (",")
  })));

  const uniqueKeys = await getOneToOneRelationships ();

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

      const props: {[propertyName: string]: string} = {};

      for (const col of columns) {
        const propertyName = toCamelCase (col.column_name);
        const nullable = col.is_nullable === "YES";
        const hasDefault = col.column_default != null;

        const propType = mapPostgresTypeToPropType (col.data_type);
        props[propertyName] = `${propType} ("${propertyName}", "${col.column_name}")${hasDefault ? `.hasDefault ()` : nullable ? `.nullable ()` : ""}`;
      }

      for (const fk of foreignKeys) {
        const lRef = fk.column_names[0];
        const rRef = fk.foreign_column_names[0];

        // homeTeamId -> homeTeam
        const propertyName = toCamelCase (lRef).replace (`${toPascalCase (rRef)}`, "");

        const col = columns.find (c => c.column_name === lRef);
        const nullable = col.is_nullable === "YES";

        props[propertyName] = `BelongsTo ("${propertyName}", "${fk.foreign_table_schema}.${fk.foreign_table_name}", { lRef: "${lRef}", rRef: "${rRef}" })${nullable ? `.nullable ()` : ""}`;
      }

      for (const fk of reversedForeignKeys) {
        const ufk = uniqueKeys.find (uk => uk.fk_name === fk.constraint_name);
        const lRef = fk.foreign_column_names[0];
        const rRef = fk.column_names[0];

        if (ufk) {
          const propertyName = toCamelCase (fk.table_name);
          props[propertyName] = `HasOne ("${propertyName}", "${fk.table_schema}.${fk.table_name}", { lRef: "${lRef}", rRef: "${rRef}" })`;
        } else {
          const propertyName = pluralize (toCamelCase (fk.table_name));
          props[propertyName] = `HasMany ("${propertyName}", "${fk.table_schema}.${fk.table_name}", { lRef: "${lRef}", rRef: "${rRef}" })`;
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

        props[propertyName] = `BelongsToMany ("${propertyName}", "${rRel.foreign_table_schema}.${rRel.foreign_table_name}", { lRef: "${lRef}", lxRef: "${lxRef}", xTable: "${xTable}", rxRef: "${rxRef}", rRef: "${rRef}" })`;
      }

      const interfaceProperties = Object.values (props);

      return `export const ${tableName} = Table ("${table_schema}.${table}", [\n  ${interfaceProperties.join (",\n  ")}\n]);`;
    }));

  const fileContent = interfacesNew.join ("\n\n");
  await fs.appendFile (`${outputDir}/tables.ts`, fileContent);

  console.log ("RefQL schema generated successfully!");
}

function mapPostgresTypeToPropType(pgType: string): string {
  switch (pgType) {
    case "integer":
    case "bigint":
      return "NumberProp";
    case "text":
    case "varchar":
    case "character varying":
      return "StringProp";
    case "boolean":
      return "BooleanProp";
    case "timestamp without time zone":
    case "timestamp with time zone":
    case "date":
      return "DateProp";
    default:
      return "Prop";
  }
}

