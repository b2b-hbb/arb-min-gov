'use strict';

/** @typedef {import('../rpc/provider.js').Provider} Provider */
/** @typedef {import('../wallet/index.js').Wallet} Wallet */

/**
 * @typedef {Object} ProviderState
 * @property {Provider | null} _currentRPCProviderFromUrl - The latest RPC provider instance.
 * @property {Wallet[]} _currentWalletProviders - The wallet providers from EIP-6963.
 * @property {Wallet | null} _cachedSelectedWallet - cached selected wallet instance
 */

/** @type {ProviderState} */
const providerState = {
    _currentRPCProviderFromUrl: null,
    _currentWalletProviders: [],
    _cachedSelectedWallet: null,
};

const ProviderState = {
    /** @param {Wallet} wallet */
    setSelectedWallet: (wallet) => {
        providerState._currentRPCProviderFromUrl = Object.freeze(wallet);
    },
    
    /** @param {Provider} provider */
    setRpcProvider: (provider) => {
        providerState._currentRPCProviderFromUrl = Object.freeze(provider);
    },

    /** @param {Wallet} wallet */
    addWalletProvider: (wallet) => {
        providerState._currentWalletProviders.push(Object.freeze(wallet));
    },

    // TODO: should use es6 proxy instead?

    /** @returns {Wallet | null} wallet */
    getSelectedWallet: () => providerState._cachedSelectedWallet,

    /** @returns {Wallet[]} wallets */
    getWalletProviders: () => providerState._currentWalletProviders,
    
    /** @returns {Provider | null} provider */
    getRpcProvider: () => providerState._currentRPCProviderFromUrl,
};

const getProposals = async () => {
    const data = await import('./proposals.json', {
        with: { type: 'json' }
    });
    return data.default
}

export { getProposals, ProviderState }
