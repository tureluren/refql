import Tokenizer from ".";

const isTokenizer = (value): value is Tokenizer =>
  value instanceof Tokenizer;

export default isTokenizer;