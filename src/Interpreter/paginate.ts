import over from "../Environment2/over";

const paginate = (limit?: number, offset?: number) =>
  over ("query", q => {
    if (limit != null) {
      q += ` limit ${limit}`;
    }
    if (offset != null) {
      q += ` offset ${offset}`;
    }
    return q;
  });

export default paginate;