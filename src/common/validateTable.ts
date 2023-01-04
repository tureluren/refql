const validateTable = (table: string) => {
  if (typeof table !== "string") {
    throw new Error ("Invalid table: not a string");
  }
};

export default validateTable;