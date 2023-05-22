import { RefInput } from "../common/types.ts";

const validateRefInput = (input: RefInput) => {
  if (!(toString.call (input) === "[object Object]")) {
    throw new Error ("Invalid input: input is not an object");
  }

  if ("lRef" in input && typeof input.lRef !== "string") {
    throw new Error ("Invalid input: lRef is not a string");
  }

  if ("rRef" in input && typeof input.rRef !== "string") {
    throw new Error ("Invalid input: rRef is not a string");
  }

  if ("xTable" in input && typeof input.xTable !== "string") {
    throw new Error ("Invalid input: xTable is not a string");
  }

  if ("lxRef" in input && typeof input.lxRef !== "string") {
    throw new Error ("Invalid input: lxRef is not a string");
  }

  if ("rxRef" in input && typeof input.rxRef !== "string") {
    throw new Error ("Invalid input: rxRef is not a string");
  }
};

export default validateRefInput;