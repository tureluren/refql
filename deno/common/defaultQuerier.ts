import { Querier } from "./types.ts";

let defaultQuerier: Querier | undefined;

export const setDefaultQuerier = (querier: Querier) => {
  defaultQuerier = querier;
};

const getDefaultQuerier = () =>
  defaultQuerier;

export default getDefaultQuerier;