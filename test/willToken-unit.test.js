const { assert, expect } = require("chai");
const { network, getNamedAccounts, deployments } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("WillToken Unit Test", function () {
          //Multipler is used to make reading the math easier because of the 18 decimal points
          const multiplier = 10 ** 18;
          let deployer, user1, willToken;
          beforeEach(async function () {
              const accounts = await getNamedAccounts();
              deployer = accounts.deployer;
              user1 = accounts.user1;

              await deployments.fixture("all");
              willToken = await ethers.getContract("WillToken", deployer);
          });

          it("was deployed", async () => {
              assert(willToken.address);
          });
          it("initializes the token with the correct name and symbol ", async () => {
              const name = (await willToken.name()).toString();
              assert.equal(name, "willToken");

              const symbol = (await willToken.symbol()).toString();
              assert.equal(symbol, "WT");
          });
          describe("transfers", () => {
              it("Should be able to transfer tokens successfully to an address", async () => {
                  const tokensToSend = ethers.utils.parseEther("10");
                  await willToken.transfer(user1, tokensToSend);
                  const user1Balance = await willToken.balanceOf(user1);
                  expect(user1Balance).to.equal(tokensToSend);
              });
              it("emits an transfer event, when an transfer occurs", async () => {
                  await expect(
                      willToken.transfer(user1, (10 * multiplier).toString())
                  ).to.emit(willToken, "Transfer");
              });
          });
          describe("allowances", () => {
              const amount = (20 * multiplier).toString();
              beforeEach(async () => {
                  // Interact with the smart contract as a player
                  playerToken = await ethers.getContract("WillToken", user1);
              });
              it("Should approve other address to spend token", async () => {
                  const tokensToSpend = ethers.utils.parseEther("5");
                  //Deployer is approving that user1 can spend 5 of their precious WT's
                  await willToken.approve(user1, tokensToSpend);
                  await playerToken.transferFrom(
                      deployer,
                      user1,
                      tokensToSpend
                  );
                  const playerBalance = await willToken.balanceOf(user1);
                  expect(playerBalance).to.equal(tokensToSpend);
              });
              it("doesn't allow an unapproved member to do transfers", async () => {
                  const tokensNotAllowedToSpend = ethers.utils.parseEther("5");
                  await expect(
                      playerToken.transferFrom(
                          deployer,
                          user1,
                          tokensNotAllowedToSpend
                      )
                  ).to.be.revertedWith(
                      "ERC20: transfer amount exceeds allowance"
                  );
              });
              it("emits an approval event, when an approval occurs", async () => {
                  await expect(willToken.approve(user1, amount)).to.emit(
                      willToken,
                      "Approval"
                  );
              });
              it("the allowance being set is accurate", async () => {
                  await willToken.approve(user1, amount);
                  const allowance = await willToken.allowance(deployer, user1);
                  assert.equal(allowance.toString(), amount);
              });
              it("won't allow a user to go over the allowance", async () => {
                  await willToken.approve(user1, amount);
                  await expect(
                      playerToken.transferFrom(
                          deployer,
                          user1,
                          (40 * multiplier).toString()
                      )
                  ).to.be.revertedWith(
                      "ERC20: transfer amount exceeds allowance"
                  );
              });
          });
      });
