"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const Job = require("../models/job")

let id1;
let id2;

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  a1Token
} = require("./_testCommon");

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

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: "Nice One",
        salary: 100000,
        companyHandle: "c2"
    };

  test("works for admin", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send(newJob)
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toMatchObject({
      job: newJob,
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "this should not work",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          ...newJob,
          equity: false,
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

test("unauth for non-admin user", async function () {
  const resp = await request(app)
        .post("/jobs")
        .send({
            ...newJob,
            equity: false,
        })
      .set("authorization", `Bearer ${u1Token}`);
  expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anonymous", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
            ...newJob,
            equity: false,
        })
    expect(resp.statusCode).toEqual(401);
    });

});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toMatchObject({
      jobs:
          [
            {
                title: "worker",
                salary: 50000,
                equity: "0",
                companyHandle: "c1"
            },
            {
                title: "manager",
                salary: 90000,
                equity: "0.01",
                companyHandle: "c1"
            }
          ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${id1}`);
    expect(resp.body).toMatchObject({
      job: {
        title: "worker",
        salary: 50000,
        equity: "0",
        companyHandle: "c1"
      },
    });
  });

  test("not found for no such job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/${id1}`)
        .send({
          title: "skilled worker",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toMatchObject({
      job: {
        title: "skilled worker",
        salary: 50000,
        equity: "0",
        companyHandle: "c1"
      },
    });
  });

  test("unauth for non-admin user", async function () {
    const resp = await request(app)
        .patch(`/jobs/${id1}`)
        .send({
            title: "skilled worker",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${id1}`)
        .send({
            title: "skilled worker",
        })
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
            title: "skilled worker",
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${id1}`)
        .send({
          id: 77777,
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${id1}`)
        .send({
          equity: false,
        })
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/${id1}`)
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.body).toEqual({ deleted: id1 });
  });

  test("unauth for non-admin user", async function () {
    const resp = await request(app)
        .delete(`/jobs/${id1}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${id1}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${a1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
