import keys from "../more/keys";
import { Plurals } from "../types";
import isObject from "./isObject";
import isString from "./isString";

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