var AccessControlManager = artifacts.require("./AccessControlManager.sol");

module.exports = function(deployer) {
  deployer.deploy(AccessControlManager);
};
