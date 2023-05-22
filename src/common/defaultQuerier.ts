import { Querier } from "./types";

let defaultQuerier: Querier | undefined;

export const setDefaultQuerier = (querier: Querier) => {
  defaultQuerier = querier;
};

const getDefaultQuerier = () =>
  defaultQuerier;

export default getDefaultQuerier;