import Tokenizer from ".";

const isTokenizer = (value: any): value is Tokenizer =>
  value instanceof Tokenizer;

export default isTokenizer;