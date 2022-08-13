const formatTlString = (tls: string) =>
  tls
    // remove linebreaks
    .replace (/\n/g, "")
    // replace multispaces with a single space
    .replace (/\s\s+/g, " ")
    // trim
    .trim ();

export default formatTlString;