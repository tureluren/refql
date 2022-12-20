const format = (str: string) =>
  str
    .replace (/\n/g, "")
    .replace (/\s\s+/g, " ")
    .trim ();

export default format;