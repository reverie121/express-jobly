const { BadRequestError } = require("../expressError");

/** Formats input data for a sql query.
 * 
 * returns an object with properties...
 * setCols: string of column names (comma separated)
 *   that are set equal to incrementing variables
 * values: an array of values to substitute 
 *   for the incrementing variables
 * ...extracted from the dataToUpdate object.
 * 
 * jsToSql object can be used to translate column name
 * from input naming convetion to database naming convention.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  // if no data in input, return an error
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
