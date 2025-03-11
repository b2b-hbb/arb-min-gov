'use strict';

import { contracts, funcSigs, eventSigs, isChainSupported } from "./consts.js"
import { parseUTF8String, encodeFuncSigAndBytes32, encodeFuncSigAndBytes32AndAddress, encodeFuncSigAndAddressAndBytes32, parseProposalCreatedData } from "./abi.js"
import { getProposals } from "../store/index.js"

/** @typedef {import('../rpc/provider.js').Provider} Provider */
/** @typedef {import('../wallet/index.js').Wallet} Wallet */

/**
 * @param {Provider} provider
 * @returns {Promise<bigint>}
*/
const getChainId = async (provider) => {
    const res = await provider.request({
        "method": "eth_chainId",
        "params": [],
    });
    
    return BigInt(res);
}

/**
 * 
 * @param {Provider} provider 
 * @returns {Promise<String>}
 */
const getLatestBlock = async (provider) => {
    const res = await provider.request({
        "method": "eth_getBlockByNumber",
        "params": ["latest", false],
    });

    return res;
}

/**
 * @param {Provider} provider 
 */
const queryTokenName = async (provider) => {
    const output = await provider.request({
        "method": "eth_call",
        "params": [
            {
                to: contracts["arb-token"]["arb1"],
                input: funcSigs["name()"]
            },
            "latest"
        ],
    });
    const name = parseUTF8String(output)
    return name;
}

/**
 * @param {Provider} provider 
 * @param {BigInt} startBlock
 * @param {BigInt} endBlock
 * @param {string} address
 * @param {string[]} topics
 */
const getLogs = async (provider, startBlock, endBlock, address, topics) => {
    return provider.request({
        "method": "eth_getLogs",
        "params": [
            {
                fromBlock: "0x" + startBlock.toString(16),
                toBlock: "0x" + endBlock.toString(16),
                address: address,
                topics: topics
            }
        ],
    });
}

/**
 * @param {Date} date 
 * @returns {BigInt} blockNumber associated with given date
 */
const dateToEthBlock = async (date) => {
    // TODO: implement logic use anchors
    return BigInt("0x0F03A7BF")
}

/**
 * 
 * @param {Provider} provider 
 * @param {Date} startDate 
 * @param {Date} endDate 
 */
const getProposalCreatedEvents = async (provider, startDate, endDate) => {
    // TODO: use certain block number to date anchors to speed up potential binary search from eth to arb block num
    // TODO: use arb block num instead of eth
    const startBlock = await dateToEthBlock(startDate)
    const endBlock = await dateToEthBlock(endDate)
    // TODO: create batches of requests based on start and end block ranges (maybe chunk requests per 1k blocks)
    const coreGovLogs = await getLogs(
        provider,
        startBlock,
        endBlock,
        contracts["core-governor"]["arb1"],
        [eventSigs["ProposalCreated"]]
    )
    const treasuryGovLogs = await getLogs(
        provider,
        startBlock,
        endBlock,
        contracts["treasury-governor"]["arb1"],
        [eventSigs["ProposalCreated"]]
    )

    return [
        ...coreGovLogs,
        ...treasuryGovLogs
    ]
}

/**
 * 
 * @param {Provider} provider 
 * @param {string} proposalId 
 */
const queryProposalState = async (provider, proposalId) => {
    const input = encodeFuncSigAndBytes32(funcSigs["state(uint256 proposalId)"], proposalId)

    const output = await provider.request({
        "method": "eth_call",
        "params": [
            {
                to: contracts["treasury-governor"]["arb1"],
                input: input

            },
            "latest"
        ],
    });

    return output
}

const queryHasVoted = async (provider, proposalId, account) => {
    const input = encodeFuncSigAndBytes32AndAddress(
        funcSigs["hasVoted(uint256 proposalId, address account)"],
        proposalId,
        account
    )

    const output = await provider.request({
        "method": "eth_call",
        "params": [
            {
                to: contracts["treasury-governor"]["arb1"],
                input: input

            },
            "latest"
        ],
    });

    return output
}


const queryProposalSnapshot = async (provider, proposalId) => {
    const input = encodeFuncSigAndBytes32(
        funcSigs["proposalSnapshot(uint256 proposalId)"],
        proposalId,
    )

    const output = await provider.request({
        "method": "eth_call",
        "params": [
            {
                to: contracts["treasury-governor"]["arb1"],
                input: input

            },
            "latest"
        ],
    });

    return output
}

const queryGetVotes = async (provider, account, blockNumber) => {
    const paddedBlockNum = "0x" + blockNumber.substring(2).padStart(64, "0")

    const input = encodeFuncSigAndAddressAndBytes32(
        funcSigs["getVotes(address account, uint256 blockNumber)"],
        account,
        paddedBlockNum,
    )

    const output = await provider.request({
        "method": "eth_call",
        "params": [
            {
                to: contracts["treasury-governor"]["arb1"],
                input: input

            },
            "latest"
        ],
    });

    return output
}

const queryGetVotesLatest = async (provider, account) => {
    const block = await getLatestBlock(provider)
    const prev = "0x" + (BigInt(block.l1BlockNumber) - BigInt(1)).toString(16)

    return await queryGetVotes(provider, account, prev)
}

const queryGetVotesByProposal = async (provider, account, proposalId) => {
    const blockNumber = await queryProposalSnapshot(provider, proposalId)

    return await queryGetVotes(provider, account, blockNumber)
}


const queryProposalByEvent = async (provider, proposalId, blockNumber) => {
    const props = await getProposals()

    const curr = props[0]

    if (curr.chainId !== "0xa4b1") {
        throw new Error("invalid chain id")
    }

    const treasuryGovLogs = await getLogs(
        provider,
        curr.l2Block,
        curr.l2Block,
        curr.governor,
        [eventSigs["ProposalCreated"]]
    )

    const parsed = parseProposalCreatedData(treasuryGovLogs[0].data)

    return parsed
}

/**
 * @param {Provider} provider 
 */
const getAllProposals = (provider) => {
    // TODO: should we make it so no need for provider?
    // store more data in json or browser app state

    // TODO: actually load cache
    // TODO: check if missing proposals or non-indexed blocks
    return getProposals()
}


/**
 * 
 * @param {Wallet} wallet 
 * @returns 
 */
const castVote = async (wallet) => {
    // function castVote(uint256 proposalId, uint8 support) public virtual returns (uint256 balance);
    // TODO: first check tx checkBeforeTx()
    // TODO: have proposal info

    // TODO: assess having a wallet folder with all dom hooks and js logic instead of spread this way
    

    const output = await wallet.provider.request({
        "method": "eth_sendTransaction",
        "params": [
            {
                to: contracts["arb-token"]["arb1"],
                input: funcSigs["name()"],
                from: "0xb80170a1bCEdC322bC448dE1e92B39076819fa3d",
                // value: 0,
                // gasLimit: 0,
                // maxPriorityFeePerGas: 0,
                // maxFeePerGas: 0,

            },
        ],
    })

    console.log(output)

    return output
}



export { getChainId, getAllProposals, getLatestBlock, castVote, isChainSupported }
