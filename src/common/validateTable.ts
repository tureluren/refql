import Table from "../Table";

const validateTable = (table: string | Table) => {
  if (Table.isTable (table)) return;

  if (typeof table !== "string") {
    throw new Error (`Invalid table: ${table}, expected a string`);
  }
};

export default validateTable;