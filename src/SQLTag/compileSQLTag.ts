// @ts-nocheck
import SQLTag from ".";
import In from "../In";
import Raw from "../Raw";
import RQLTag from "../RQLTag";
import Table from "../Table";
import formatSQLString from "./formatSQLString";

function zip() {
  var args = [].slice.call (arguments);
  var longest = args.reduce (function (a, b) {
    return a.length > b.length ? a : b;
  }, []);

  return longest.map (function (_, i) {
    return args.map (function (array) { return array[i]; });
  });
}
const compileSQLTag = <Params>(tag: SQLTag<Params>, paramIdx: number, params: Params, table?: Table): [string, any[]] => {
  const values: any[] = [];

  const go = (sqlTag: SQLTag<Params>): string => {
    return zip (sqlTag.strings, sqlTag.values).reduceRight ((acc, pair) => {
      // let value = sqlTag.values[idx];
      let [str, value] = pair;
      console.log (pair);

      if (typeof value !== "undefined") {

        if (typeof value === "function") {
          value = value (params, table);
        }

        if (RQLTag.isRQLTag<Params> (value)) {
          throw new Error ("You can't use RQL Tags inside SQL Tags");
        }

        if (SQLTag.isSQLTag<Params> (value)) {
          return `${go (value)} ${str ? str : ""} ${acc}`;
        }

        if (Table.isTable (value)) {
          return `${value.as} ${str ? str : ""} ${acc}`;
        }

        if (Raw.isRaw (value)) {
          return `${value.value} ${str ? str : ""} ${acc}`;
        }

        if (In.isIn (value)) {
          const inStr = value.write (paramIdx + values.length);
          values.push (...value.arr);
          return `${inStr} ${str ? str : ""} ${acc}`;
        }

        values.push (value);

        return `$${paramIdx + values.length} ${str ? str : ""} ${acc}`;
      }

      return `${str} ${acc}`;
    }, "");
  };

  return [formatSQLString (go (tag)), values];
};

// const compileSQLTag = <Params>(tag: SQLTag<Params>, paramIdx: number, params: Params, table?: Table): [string, any[]] => {
//   const values: any[] = [];

//   const go = (sqlTag: SQLTag<Params>): string => {
//     return sqlTag.strings.reduce ((acc, str, idx) => {
//       let value = sqlTag.values[idx];

//       if (typeof value !== "undefined") {

//         if (typeof value === "function") {
//           value = value (params, table);
//         }

//         if (RQLTag.isRQLTag<Params> (value)) {
//           throw new Error ("You can't use RQL Tags inside SQL Tags");
//         }

//         if (SQLTag.isSQLTag<Params> (value)) {
//           return `${acc} ${str} ${go (value)}`;
//         }

//         if (Table.isTable (value)) {
//           return `${acc} ${str} ${value.as}`;
//         }

//         if (Raw.isRaw (value)) {
//           return `${acc} ${str} ${value.value}`;
//         }

//         if (In.isIn (value)) {
//           const inStr = value.write (paramIdx + values.length);
//           values.push (...value.arr);
//           return `${acc} ${str} ${inStr}`;
//         }

//         values.push (value);

//         return `${acc} ${str} $${paramIdx + values.length}`;
//       }

//       return `${acc} ${str}`;
//     }, "");
//   };

//   return [formatSQLString (go (tag)), values];
// };

export default compileSQLTag;