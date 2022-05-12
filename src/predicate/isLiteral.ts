const isLiteral = tokenType =>
  tokenType === "NUMBER"
    || tokenType === "STRING"
    || tokenType === "true"
    || tokenType === "false"
    || tokenType === "null";

export default isLiteral;