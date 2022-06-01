import { Plurals, Rules } from "../types";

const Irregulars: Plurals = {
  addendum: "addenda",
  alga: "algae",
  alumnus: "alumni"
};

const rules: Rules = [
  [/(.*)is$/i, "$1es"],
  [/(.*)(ss|s|sh|ch|x|z)$/i, "$1$2es"],
  [/(.*)([bcdfghjklmnpqrstvwxys])y/i, "$1$2ies"],
  [/(.*)ff|fe|f$/i, "$1ves"],
  [/(.*)on$/i, "$1a"]
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

    if (this.pluralize) {
      for (const [regexp, extend] of rules) {

        const matched = singular.replace (regexp, extend);

        if (matched === singular) {
          continue;
        }

        return matched;
      }

      return singular + "s";
    }

    return singular;
  }
}

export default Pluralizer;