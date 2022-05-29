import { RefQLConfig } from "../types";

const refQLConfig: RefQLConfig = {
  pluralize: true,
  caseTypeJS: "camel",
  caseTypeDB: "snake",
  detectRefs: true,
  plurals: {},
  refs: {},
  useSmartAlias: true
};

export default refQLConfig;