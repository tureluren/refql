import { Refs } from "./types.ts";

const emptyRefs = (): Refs => ({
  lrefs: [],
  rrefs: [],
  lxrefs: [],
  rxrefs: []
});

export default emptyRefs;