const jwt = require("jsonwebtoken");
const { sqlForPartialUpdate } = require("./sql");
const { SECRET_KEY } = require("../config");

let updateData = {firstName: 'Aliya', age: 32}
let colNameTranslation = {firstname: "first_name"}

describe("sqlForPartialUpdate", function () {
  test("works: good data", function () {
    const sqlInputs = sqlForPartialUpdate(updateData, colNameTranslation);
    expect(sqlInputs).toEqual({
      setCols: "\"firstName\"=$1, \"age\"=$2",
      values: ["Aliya", 32]
    });
  });

});
