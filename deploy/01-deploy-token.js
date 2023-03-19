const { network } = require("hardhat");
const {
    INITIAL_SUPPLY,
    developmentChains,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    console.log;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const args = [INITIAL_SUPPLY];
    const willToken = await deploy("WillToken", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    log(`willToken deployed at ${willToken.address}`);

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(willToken.address, args);
    }
};

module.exports.tags = ["all", "token"];
