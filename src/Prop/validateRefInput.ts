import { RefInput } from "../common/types";

const isStringArray = (value: any): value is string[] => {
  return Array.isArray (value) && value.every (item => typeof item === "string");
};

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

  if (input.lRef && input.rRef && input.lRef.length !== input.rRef.length) {
    throw new Error ("Invalid input: lRef and rRef must have the same number of elements");
  }

  if (input.lxRef && input.rxRef && input.lxRef.length !== input.rxRef.length) {
    throw new Error ("Invalid input: lxRef and rxRef must have the same number of elements");
  }
};

export default validateRefInput;
