import { Link } from "../types";

const associate = (tableFrom: string, tableTo: string, links: Link[]) =>
  links.reduce ((acc, [fromCol, toCol]) => {
    if (acc) {
      acc += " and ";
    }
    acc += `"${tableFrom}".${fromCol} = "${tableTo}".${toCol}`;
    return acc;
  }, "");

export default associate;