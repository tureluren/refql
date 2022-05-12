const getType = (value): string =>
  value && value["@@rql/type"] || {}.toString.call (value).slice (8, -1);

export default getType;