import keys from "../more/keys.ts";
import { Plurals } from "../types.ts";
import isObject from "./isObject.ts";
import isString from "./isString.ts";

const arePlurals = (value: any): value is Plurals => {
  if (!isObject (value)) {
    return false;
  }

  let theyAre = true;

  keys<Plurals> (value).forEach (singular => {
    const plural = value[singular];

    if (!isString (plural)) {
      theyAre = false;
      return;
    }
  });

  return theyAre;
};

export default arePlurals;