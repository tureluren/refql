import * as fs from "fs-extra";
import pluralize from "pluralize";
import { getColumns, getOneToOneRelationships, getRelationships, getTables } from "./queries";

function sanitizeToIdentifier(input: string): string {
  // Ensure the string starts with a letter; remove invalid leading characters.
  const start = input.replace (/^[^A-Za-z]+/, "");

  // Keep only valid characters (letters, digits, underscores).
  const sanitized = start.replace (/[^A-Za-z0-9_]/g, "");

  return sanitized;
}

function toCamelCase(str: string): string {
  return str
    .toLowerCase () // Convert the entire string to lowercase for consistency
    .replace (/(?:[_\-\s]+([a-z]))|^[A-Z]/g, (_, letter, offset) =>
      offset === 0 ? str.charAt (0).toLowerCase () : (letter ? letter.toUpperCase () : "")
    );
}


function toPascalCase(str: string): string {
  const camel = toCamelCase (str);
  return camel.charAt (0).toUpperCase () + camel.slice (1);
}

export async function generateInterfaces(outputDir: string) {
  const tables = await getTables ();
  const relationships = await getRelationships ().then (rels => rels.map (rel => ({
    ...rel,
    column_names: rel.column_names.replace (/^{|}$/g, "").split (","),
    foreign_column_names: rel.foreign_column_names.replace (/^{|}$/g, "").split (",")
  })));

  const uniqueKeys = await getOneToOneRelationships ();

  const interfacesNew = await Promise.all (
    tables.map (async table => {
      const tableName = toPascalCase (table);
      const columns = await getColumns (table);
      const foreignKeys = relationships.filter (rel => rel.table_name === table);
      const reversedForeignKeys = relationships.filter (rel => rel.foreign_table_name === table);
      const properties: {[propertyName: string]: string} = {};
      console.log (uniqueKeys);

      for (const col of columns) {
        const propertyName = toCamelCase (col.column_name);
        const tsType = mapPostgresTypeToTS (col.data_type);
        properties[propertyName] = `${propertyName}${col.is_nullable === "YES" ? "?" : ""}: ${tsType};`;
      }

      for (const fk of foreignKeys) {
        const firstCol = fk.column_names[0];
        const firstFkCol = fk.foreign_column_names[0];

        // homeTeamId -> homeTeam
        const propertyName = toCamelCase (firstCol).replace (`${toPascalCase (firstFkCol)}`, "");

        const tsType = toPascalCase (fk.foreign_table_name);
        const col = columns.find (c => c.column_name === firstCol);
        properties[propertyName] = `${propertyName}${col.is_nullable === "YES" ? "?" : ""}: ${tsType};`;
      }

      for (const fk of reversedForeignKeys) {
        const ufk = uniqueKeys.find (uk => uk.fk_name === fk.constraint_name);

        if (ufk) {
          const propertyName = toCamelCase (fk.table_name);
          const tsType = toPascalCase (fk.table_name);
          properties[propertyName] = `${propertyName}?: ${tsType};`;
        } else {
          const propertyName = pluralize (toCamelCase (fk.table_name));
          const tsType = toPascalCase (fk.table_name);
          properties[propertyName] = `${propertyName}: ${tsType}[];`;
        }
      }

      // ALS ALLE columns foreignKeys zijn dan zitte we met many to many

      // Deduplicate properties
      const interfaceProperties = Object.values (properties);

      return `export interface ${tableName} {\n  ${interfaceProperties.join ("\n  ")}\n}`;
    }));

  const fileContent = interfacesNew.join ("\n\n");
  await fs.outputFile (`${outputDir}/interfaces.ts`, fileContent);
  console.log ("Interfaces generated successfully!");
}

function mapPostgresTypeToTS(pgType: string): string {
  switch (pgType) {
    case "integer":
    case "bigint":
      return "number";
    case "text":
    case "varchar":
    case "character varying":
      return "string";
    case "boolean":
      return "boolean";
    case "timestamp without time zone":
    case "timestamp with time zone":
      return "Date";
    default:
      return "any";
  }
}

