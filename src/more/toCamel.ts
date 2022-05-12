const toCamel = (str: string) =>
  str.charAt (0).toLowerCase ()
  + str
    .slice (1)
    .replace (/(_\w)/g, c => c[1].toUpperCase ());

export default toCamel;