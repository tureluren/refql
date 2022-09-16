function concat (sg: any): <SG extends { concat: Function }>(sg2: SG) => SG;
function concat <SG extends { concat: Function }>(sg: any, sg2: SG): SG;
function concat(sg: any, sg2?: any): any | (<SG extends { concat: Function }>(sg2: SG) => SG) {
  const go = <SG extends { concat: Function }>(sg2: SG): SG =>
    sg2.concat (sg);

  return !sg2 ? go : go (sg2);
}

export default concat;