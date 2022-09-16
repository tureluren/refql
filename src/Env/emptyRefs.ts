import { Refs } from "../common/types";

const emptyRefs = (): Refs => ({
  lrefs: [],
  rrefs: [],
  lxrefs: [],
  rxrefs: []
});

export default emptyRefs;