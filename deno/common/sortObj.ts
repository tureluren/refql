const sortObject = (obj: any): any =>
  Object.keys (obj).sort ().reduce ((acc: any, k) => (acc[k] = obj[k], acc), {});

export default sortObject;