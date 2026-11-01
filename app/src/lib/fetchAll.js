// The database answers at most 1000 rows at a time, so a long history must be read page by page. A shorter list would
// silently give wrong totals. Each query needs a stable order.
const PAGE = 1000

export async function fetchAll(query) {
  const rows = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await query().range(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...data)
    if (data.length < PAGE) return rows
  }
}
