import {loadMetamask} from "./dom.js";
/**
 * @typedef {import('../rpc/provider.js').Provider} Provider
 */

/**
 * @typedef {Object} WalletInfo
 * @property {string} uuid - Unique identifier of the wallet.
 * @property {string} name - Name of the wallet (e.g., "MetaMask").
 * @property {string} icon - Wallet icon URL.
 * @property {string} rdns - Reverse domain notation identifier.
 */
/**
 * @typedef {Object} Wallet
 * @property {WalletInfo} info - Information about the wallet.
 * @property {Provider} provider - The provider interface for the wallet.
 */

const checkBeforeTx = async (provider, intendedChainId, from) => {
    // TODO: proxy in wallet that runs this before json rpc requests to eth_sendTransaction
    // ismetamask
    // isunlocked
    // TODO: check connected to intended chainid
    // eth_requestAccounts and check against from
}

export { checkBeforeTx, loadMetamask }
