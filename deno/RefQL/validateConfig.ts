import arePlurals from "../predicate/arePlurals";
import areRefs from "../predicate/areRefs";
import isBoolean from "../predicate/isBoolean";
import isFunction from "../predicate/isFunction";
import { CaseType, RefQLConfig } from "../types";


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
const validateConfig = (config: any) => {
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

  if (!arePlurals (plurals)) {
    throw new TypeError ('`plurals` should be of type { singular: "plural"}');
  }

  if (!areRefs (refs)) {
    throw new TypeError ('`refs` should be of type { tableFrom: { tableTo: [["tableFromCol", "tableToCol"]] } }');
  }

  return true;
};

export default validateConfig;