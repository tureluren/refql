import { Link, RefsOld } from "../types";

const setRefPath = (tableFrom: string, tableTo: string, value: Link[], refs: RefsOld): RefsOld => {
  const result = Object.assign ({}, refs);

  if (result[tableFrom] == null) {
    result[tableFrom] = { [tableTo]: value };
  } else {
    result[tableFrom][tableTo] = value;
  }

  return result;
};

export default setRefPath;