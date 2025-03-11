
const supportedChains = {
    "arb1": {
        chainId: BigInt("0xa4b1"),
    },
    "eth-mainnet": {
        chainId: BigInt("0x1"),
    },
}

const supportedChainIds = Object.values(supportedChains).map(chain => chain.chainId);

/**
 * @param {BigInt} chainId 
 * @returns {boolean}
 */
const isChainSupported = (chainId) => supportedChainIds.includes(chainId)

/**
 * Relevant token addresses
 * https://github.com/ArbitrumFoundation/docs/blob/861a42fe2a70106fc2fbafd0e6343902864a77c3/docs/deployment-addresses.md
 */
const contracts = {
    "arb-token": {
        "eth-mainnet": "0xB50721BCf8d664c30412Cfbc6cf7a15145234ad1",
        "arb1": "0x912CE59144191C1204E64559FE8253a0e49E6548",
    },
    "core-governor": {
        "arb1": "0xf07DeD9dC292157749B6Fd268E37DF6EA38395B9"
    },
    "treasury-governor": {
        "arb1": "0x789fC99093B09aD01C34DC7251D0C89ce743e5a4"
    },
}


/*
 Event and function signatures can be manually locally verified or using something like https://www.4byte.directory/
 Relevant repos include:
 - https://github.com/ArbitrumFoundation/governance/blob/bf74af23726ca45e382e6312a978f17f58fd880f/src/L2ArbitrumGovernor.sol
 - https://github.com/OpenZeppelin/openzeppelin-contracts/tree/v4.7.3/contracts/governance
*/


const funcSigs = {
    "name()": "0x06fdde03",
    "quorum(uint256 blockNumber)": "0xf8ce560a",
    "proposalDeadline(uint256 proposalId)": "0xc01f9e37",
    "proposalSnapshot(uint256 proposalId)": "0x2d63f693",
    "proposalVotes(uint256 proposalId)": "0x544ffc9c",
    "state(uint256 proposalId)":"0x3e4f49e6",
    "hasVoted(uint256 proposalId, address account)": "0x43859632",
    "getVotes(address account, uint256 blockNumber)": "0xeb9019d4"
}

/*
 Example proposal txs:
 - create https://arbiscan.io/tx/0x4d0e1f606cdc13c0a15a92340051490be866d28feca270b18afe6cb1e55e9418
 - cast vote https://arbiscan.io/tx/0x0fbfd30272bf9e8dfd480a5a8796b99875b03818ce0717784f90a6602044a181
 - queued https://arbiscan.io/tx/0xe7c19f4311fc211d5ab320ec9ec21e56b58054f08433f5e6669a0fb014ef6d2e
*/
const eventSigs = {
    "ProposalCreated": "0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0"
}

export {
    isChainSupported, contracts, funcSigs, eventSigs
}
