function concat (sg1: any): <SG extends { concat: Function }>(sg2: SG) => SG;
function concat <SG extends { concat: Function }>(sg1: any, sg2: SG): SG;
function concat(sg1: any, sg2?: any): any | (<SG extends { concat: Function }>(sg2: SG) => SG) {
  if (!sg2) {
    return <SG extends { concat: Function }>(sg2: SG): SG =>
      sg2.concat (sg1);
  }
  return sg2.concat (sg1);
}

export default concat;