import isFunction from "../predicate/isFunction";
import Table from "../Table";

const runKeyword = <Input>(params: Input, table: Table) => <T>(keyword: ((params: Input, table: Table) => T) | T) => {
  if (isFunction (keyword)) {
    return keyword (params, table);
  }
  return keyword;
};

export default runKeyword;