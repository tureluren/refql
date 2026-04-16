const validateTable = (table: string) => {
  if (typeof table !== "string") {
    throw new Error (`Invalid table: ${table}, expected a string`);
  }
};

export const validateComponents = (components: any[]) => {
  if (!Array.isArray (components)) {
    // empty array is allowed because `select from player` is valid SQL
    throw new Error ("Invalid components: not an Array");
  }
};

export default validateTable;