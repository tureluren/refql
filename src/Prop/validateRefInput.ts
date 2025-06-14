import isStringArray from "../common/isStringArray";
import { RefInput } from "../common/types";

const validateRefInput = (input: RefInput) => {
  if (Object.prototype.toString.call (input) !== "[object Object]") {
    throw new Error ("Invalid input: input is not an object");
  }

  if ("lRef" in input && !isStringArray (input.lRef)) {
    throw new Error ("Invalid input: lRef must be an array of strings");
  }

  if ("rRef" in input && !isStringArray (input.rRef)) {
    throw new Error ("Invalid input: rRef must be an array of strings");
  }

  if ("lxRef" in input && !isStringArray (input.lxRef)) {
    throw new Error ("Invalid input: lxRef must be an array of strings");
  }

  if ("rxRef" in input && !isStringArray (input.rxRef)) {
    throw new Error ("Invalid input: rxRef must be an array of strings");
  }

  if ("xTable" in input && typeof input.xTable !== "string") {
    throw new Error ("Invalid input: xTable must be a string");
  }
};

export default validateRefInput;
