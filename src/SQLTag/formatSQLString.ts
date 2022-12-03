// nog nodig ?
const formatSQLString = (sql: string) =>
  sql
    // replace multispaces with a single space
    .replace (/\s\s+/g, " ")
    // cast after variable
    .replace (/\s::/g, "::")
    // table + member as variable
    .replace (/\.\s\$/g, ".$")
    // replace single space + dot with a dot
    .replace (/\s\./g, ".")
    // replace single space + comma with a dot
    .replace (/\s\,/g, ",")
    // replace single space + closing parenthesis with a closing parenthesis
    .replace (/\s\)/g, ")")
    // replace opening parenthesis + single space with an opening parenthesis
    .replace (/\(\s/g, "(")
    // trim
    .trim ();

export default formatSQLString;