import Table from "../Table";

const equals = (a: any, b: any) => {
  if (a === b) {
    return true;
  }

  if (a instanceof Date && b instanceof Date) {
    return a.getTime () === b.getTime ();
  }

  if (Array.isArray (a) && Array.isArray (b)) {
    if (a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!equals (a[i], b[i])) {
        return false;
      }
    }
    return true;
  }

  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys (a);
    const bKeys = Object.keys (b);
    if (aKeys.length !== bKeys.length) {
      return false;
    }
    for (const key of aKeys) {
      if (!equals (a[key], b[key])) {
        return false;
      }
    }
    return true;
  }

  if (Table.isTable (a) && Table.isTable (b)) {
    return a.equals (b);
  }

  return false;
};

export default equals;