"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

let id1;
let id2;

beforeAll(commonBeforeAll);
beforeAll(async () => {
    // noinspection SqlWithoutWhere
    await db.query("DELETE FROM jobs");

    const job1 = await Job.create({
        title: "worker",
        salary: 50000,
        equity: "0",
        companyHandle: "c1"
    });
    const job2 = await Job.create({
        title: "manager",
        salary: 90000,
        equity: "0.01",
        companyHandle: "c1"
    });
    id1 = job1.id;
    id2 = job2.id;
})

beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "Nice One",
        salary: 100000,
        equity: "0.05",
        companyHandle: "c2"
    };

  test("works", async function () {
    let job = await Job.create(newJob);
    newJob.id = job.id;
    expect(job).toEqual(newJob);

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = ${job.id}`);
    expect(result.rows).toEqual([
      {
        id: job.id,
        title: "Nice One",
        salary: 100000,
        equity: "0.05",
        companyHandle: "c2"
      },
    ]);
  });
});

/************************************** findAll */

describe("findAll", function () {
  
    test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs.length).toEqual(2);
    expect(jobs[0]).toMatchObject(
        {
          title: "worker",
          salary: 50000,
          equity: "0",
          companyHandle: "c1"
        }
      );
      expect(jobs[1]).toMatchObject(
        {
          title: "manager",
          salary: 90000,
          equity: "0.01",
          companyHandle: "c1"
        }
      );
  });
  test("works: full filters", async function () {
    let jobs = await Job.findAll({title: 'manage', minSalary: 75000, equity: true});
    expect(jobs.length).toEqual(1);
      expect(jobs[0]).toMatchObject(
        {
          title: "manager",
          salary: 90000,
          equity: "0.01",
          companyHandle: "c1"
        }
      );
  });
  test("works: title filter only", async function () {
    let jobs = await Job.findAll({title: 'manage'});
    expect(jobs.length).toEqual(1);
      expect(jobs[0]).toMatchObject(
        {
          title: "manager",
          salary: 90000,
          equity: "0.01",
          companyHandle: "c1"
        }
      );
  });
  test("works: minSalary filter only", async function () {
    let jobs = await Job.findAll({minSalary: 90000});
    expect(jobs.length).toEqual(1);
      expect(jobs[0]).toMatchObject(
        {
          title: "manager",
          salary: 90000,
          equity: "0.01",
          companyHandle: "c1"
        }
      );
  });
  test("works: equity filter only", async function () {
    let jobs = await Job.findAll({hasEquity: true});
    expect(jobs.length).toEqual(1);
      expect(jobs[0]).toMatchObject(
        {
            title: "manager",
            salary: 90000,
            equity: "0.01",
            companyHandle: "c1"
          }
      );
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    const job1 = await Job.get(id1);
    expect(job1).toMatchObject(
        {
            title: "worker",
            salary: 50000,
            equity: "0",
            companyHandle: "c1"
        }
      );
    const job2 = await Job.get(id2);
    expect(job2).toMatchObject(
        {
            title: "manager",
            salary: 90000,
            equity: "0.01",
            companyHandle: "c1"
        }
    );      
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "skilled worker",
    salary: 75000,
    equity: "0",
  };

  test("works", async function () {
    let job = await Job.update(id1, updateData);
    expect(job).toMatchObject({
      id: id1,
      ...updateData,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${id1}`);
    expect(result.rows[0]).toMatchObject(
        {
            id: id1,
            title: "skilled worker",
            salary: 75000,
            equity: "0",
        }
    );
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
        title: "skilled worker",
        salary: null,
        equity: null
    };

    let job = await Job.update(id1, updateDataSetNulls);
    expect(job).toMatchObject(
        {
            id: id1,
            title: "skilled worker",
            salary: null,
            equity: null,
        }
    );

    const result = await db.query(
        `SELECT id, title, salary, equity, company_handle AS "companyHandle"
        FROM jobs
        WHERE id = ${id1}`);
    expect(result.rows[0]).toMatchObject({
        id: id1,
        title: "skilled worker",
        salary: null,
        equity: null,
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(id1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(id2);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id='${id2}'`);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
