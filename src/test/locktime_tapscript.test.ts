import { expect } from "chai";

import {
  create_boomerang,
  recover_lock_amount,
} from "../../locktime_tapscript";

// test create_boomerang
describe("create_boomerang", function () {
  it("can create_boomerang", function () {
    expect(create_boomerang([1, 1])).to.be.equal(2);
  });
});

// test recover_lock_amount
describe("recover_lock_amount", function () {
  it("can recover_lock_amount", function () {
    expect(recover_lock_amount([1, 1])).to.be.equal(2);
  });
});
