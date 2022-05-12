import Tokenizer from ".";
import getType from "../more/getType";

const isTokenizer = (value): value is Tokenizer =>
  getType (value) === "Tokenizer";

export default isTokenizer;