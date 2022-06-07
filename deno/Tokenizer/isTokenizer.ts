import Tokenizer from "./index.ts";

const isTokenizer = (value: any): value is Tokenizer =>
  value instanceof Tokenizer;

export default isTokenizer;