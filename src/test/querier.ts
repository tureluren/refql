const querier = pool => (query, values) =>
  pool.query (query, values)
    .then (({ rows }) => rows);

export default querier;