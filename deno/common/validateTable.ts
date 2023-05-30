const validateTable = (table: string) => {
  if (typeof table !== "string") {
    throw new Error (`Invalid table: ${table}, expected a string`);
  }
};

export default validateTable;