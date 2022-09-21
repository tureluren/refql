import { Refs } from "./types";

const emptyRefs = (): Refs => ({
  lrefs: [],
  rrefs: [],
  lxrefs: [],
  rxrefs: []
});

export default emptyRefs;