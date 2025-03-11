import { ProviderState } from "../store/index.js"

/**
 * Loads wallet providers via EIP-6963.
 * @returns {Wallet[]}
 */
const loadWalletProviders = () => {
    const handler = (event) => {
        /** @type {Wallet} */
        const wallet = event.detail;

        if (wallet && wallet.info && wallet.provider) {
            ProviderState.addWalletProvider(wallet);
        }
    };

    window.addEventListener("eip6963:announceProvider", handler);
    
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    
    // TODO: check if proxy needed here to avoid race condition
    // TODO: proxy can run checks every time before executing tx
    return ProviderState.getWalletProviders()
};

/**
 * Waits for a specified amount of time.
 * @param {number} ms - Milliseconds to wait.
 * @returns {Promise<void>}
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Loads the MetaMask wallet provider.
 * @returns {Promise<Wallet>}
 */
const loadMetamask = async () => {
    const cached = ProviderState.getSelectedWallet();
    if (cached) {
        return cached;
    }

    const wallets = await loadWalletProviders();

    while (true) {
        for (const selectedWallet of wallets) {
            if (selectedWallet.info.name.toLowerCase() === "metamask") {
                ProviderState.setSelectedWallet(selectedWallet);
                return selectedWallet;
            }
        }
        console.log("Waiting for MetaMask provider...");
        await wait(500);
    }
};

export {
    loadMetamask
}
