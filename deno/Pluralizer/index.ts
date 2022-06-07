import { Plurals, Rules } from "../types.ts";

const rules: Rules = [
  [/(.*)(deer|fish|eese)$/i, ""],
  [/(.*)(?:([sx])is|(ch|sh|ss|x|zz)|([^aou]us|alias|gas|ris))$/i, "es"],
  [/(.*)(?:([aeo]l)f|([nlw]i)fe|([^d]ea)f|(ar)f)$/i, "ves"],
  [/(.*)([aeou]y)$/i, "s"],
  [/(.*)y$/i, "ies"],
  [/(.*)child$/i, "children"],
  [/(.*)man$/i, "men"],
  [/(.*)person$/i, "people"]
];

class Pluralizer {
  pluralize: boolean;
  plurals: Plurals;

  constructor(pluralize: boolean, plurals: Plurals) {
    this.pluralize = pluralize;
    this.plurals = plurals;
  }

  toPlural(singular: string) {
    const selfProvided = this.plurals[singular];

    if (selfProvided) {
      return selfProvided;
    }

    const toUpper = /.*[A-Z]$/.test (singular);

    if (this.pluralize) {
      for (const [regexp, extend] of rules) {

        const matched = singular.match (regexp);

        if (matched == null) {
          continue;
        }

        const [, ...values] = matched;

        return values.join ("") + (toUpper ? extend.toUpperCase () : extend);
      }

      return singular + (toUpper ? "S" : "s");
    }

    return singular;
  }
}

export default Pluralizer;