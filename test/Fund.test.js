const Fund = artifacts.require('Fund');

contract('Fund', function ([_, spender, fakeOrg]) {
  beforeEach(async function () {
    this.fund = await Fund.new(fakeOrg, 'Fund Name');
  });

  it('has an organization', async function () {
    (await this.fund.org()).should.equal(fakeOrg);
  });

  it('has a name', async function () {
    (await this.fund.name()).should.equal('Fund Name');
  });
});
