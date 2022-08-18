const formatSqlString = (sql: string) =>
  sql
    // replace multispaces with a single space
    .replace (/\s\s+/g, " ")
    // cast after variable
    .replace (/\s::/, "::")
    // table + AstNode as variable
    .replace (/\.\s\$/, ".$")
    // trim ending space (if str ends with $x);
    .replace (/\s\./, ".")
    // trim ending space (if str ends with $x);
    .trim ();

export default formatSqlString;