const { assertRevert } = require('./helpers/assertRevert');
const { expectEvent } = require('openzeppelin-test-helpers');

const Organization = artifacts.require('Organization');
const Token = artifacts.require('ProjectToken');

contract('StableCoin Add/Delete', function (accounts) {
  let organisation;
  let stablecoin1;
  let stablecoin2;
  let token;
  const owner = accounts[9];
  const notOwner = accounts[8];

  beforeEach(async function () {
    stablecoin1 = await Token.new();
    stablecoin2 = await Token.new();
    token = await Token.new();
    organisation = await Organization.new('TestOrganisation', token.address, owner);
  });

  it('Add StableCoin', async function () {
    const { logs } = await organisation.addStableCoin(stablecoin1.address, { from: owner });
    expectEvent.inLogs(logs, 'StableCoinAdded');
    assert.equal(stablecoin1.address, logs[0].args._address);
    assert.isTrue(await organisation.isStableCoin(stablecoin1.address));
  });

  it('Cant add same StableCoin twice', async function () {
    const { logs } = await organisation.addStableCoin(stablecoin1.address, { from: owner });
    expectEvent.inLogs(logs, 'StableCoinAdded');
    await assertRevert(organisation.addStableCoin(stablecoin1.address, { from: owner }));
  });

  it('Delete StableCoin', async function () {
    const { logs } = await organisation.addStableCoin(stablecoin1.address, { from: owner });
    expectEvent.inLogs(logs, 'StableCoinAdded');
    assert.equal(stablecoin1.address, logs[0].args._address);
    assert.isTrue(await organisation.isStableCoin(stablecoin1.address));
    await organisation.delStableCoin(stablecoin1.address, { from: owner });
    assert.isFalse(await organisation.isStableCoin(stablecoin1.address));
  });

  it('Cant delete same StableCoin twice', async function () {
    await organisation.addStableCoin(stablecoin1.address, { from: owner });
    assert.isTrue(await organisation.isStableCoin(stablecoin1.address));
    await organisation.addStableCoin(stablecoin2.address, { from: owner });
    assert.isTrue(await organisation.isStableCoin(stablecoin2.address));
    await organisation.delStableCoin(stablecoin2.address, { from: owner });
    assert.isFalse(await organisation.isStableCoin(stablecoin2.address));
    await assertRevert(organisation.delStableCoin(stablecoin2.address, { from: owner }));
  });

  it('Cant delete StableCoin if it not exists', async function () {
    await assertRevert(organisation.delStableCoin(stablecoin2.address, { from: owner }));
  });

  it('Only owner can add StableCoin', async function () {
    await assertRevert(organisation.addStableCoin(stablecoin2.address, { from: notOwner }));
  });

  it('Only owner can delete StableCoin', async function () {
    const { logs } = await organisation.addStableCoin(stablecoin1.address, { from: owner });
    expectEvent.inLogs(logs, 'StableCoinAdded');
    assert.equal(stablecoin1.address, logs[0].args._address);
    assert.isTrue(await organisation.isStableCoin(stablecoin1.address));
    await assertRevert(organisation.delStableCoin(stablecoin1.address, { from: notOwner }));
  });
});
