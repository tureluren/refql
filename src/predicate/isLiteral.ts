import { Token } from "../types";

const isLiteral = ({ type }: Token) =>
  type === "NUMBER"
    || type === "STRING"
    || type === "true"
    || type === "false"
    || type === "null";

export default isLiteral;