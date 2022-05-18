import isBoolean from "../predicate/isBoolean";
import isFunction from "../predicate/isFunction";
import isObject from "../predicate/isObject";
import isString from "../predicate/isString";
import isTableRefsObject from "../predicate/isTableRefsObject";
import { CaseType, RefQLConfig } from "../types";

// configRefs: { tableFrom: { tableTo: [["tableFromCol", "tableToCol"]] } }
const validConfigRefs = refs => {
  if (!isObject (refs)) {
    return false;
  }

  let valid = true;

  Object.keys (refs).forEach (tableFrom => {
    const tableRef = refs[tableFrom];
    valid = isTableRefsObject (tableRef);
  });

  return valid;
};

const validPlurals = plurals => {
  if (!isObject (plurals)) {
    return false;
  }

  let valid = true;

  Object.keys (plurals).forEach (key => {
    const plural = plurals[key];

    if (!isString (plural)) {
      valid = false;
      return;
    }
  });

  return valid;
};

const caseTypes: CaseType[] = ["camel", "snake"];

/**
 * pluralize: Boolean
 * caseTypeJS?: CaseType;
 * caseTypeDB?: CaseType;
 * debug?: Function
 * detectRefs: Boolean
 * plurals: { singular: "plural" }
 * refs: { tableFrom: { tableTo: [["tableFromCol", "tableToCol"]] } }
 */
const validateConfig = config => {
  const {
    pluralize, caseTypeJS, caseTypeDB,
    debug, detectRefs, onSetupError, plurals, refs
  } = <RefQLConfig>config;

  if (!isBoolean (pluralize)) {
    throw new TypeError ("`pluralize` should be of type Boolean");
  }

  if (debug != null && !isFunction (debug)) {
    throw new TypeError ("`debug` should be of type Function");
  }

  if (onSetupError != null && !isFunction (onSetupError)) {
    throw new TypeError ("`onSetupError` should be of type Function");
  }

  if (caseTypeJS != null && !caseTypes.includes (caseTypeJS)) {
    throw new TypeError (`${`caseTypeJS`} should be one of the following: ${caseTypes.join (", ")}`);
  }

  if (caseTypeDB != null && !caseTypes.includes (caseTypeDB)) {
    throw new TypeError (`${`caseTypeDB`} should be one of the following: ${caseTypes.join (", ")}`);
  }

  if (!isBoolean (detectRefs)) {
    throw new TypeError ("`detectRefs` should be of type Boolean");
  }

  if (!validPlurals (plurals)) {
    throw new TypeError ('`plurals` should be of type { singular: "plural"}');
  }

  if (!validConfigRefs (refs)) {
    throw new TypeError ('`refs` should be of type { tableFrom: { tableTo: [["tableFromCol", "tableToCol"]] } }');
  }

  return true;
};

export default validateConfig;