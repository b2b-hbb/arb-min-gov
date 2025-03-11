import { ProviderState } from "../store/index.js"
import { createRpcProvider } from "./provider.js"

/**
 * Relevant resources:
 * - https://eips.ethereum.org/EIPS/eip-1193
 * - https://eips.ethereum.org/EIPS/eip-6963
 */

/**
 * Initializes and sets up the RPC provider.
 * @param {string} [rpcUrl] - Optional RPC URL.
 * @returns {Promise<void>}
 */
const setupProvider = async (rpcUrl = undefined) => {
    try {
        const provider = await createRpcProvider(rpcUrl);

        if (provider === undefined) {
            console.error("no provider available")
            throw new Error("no rpc provider available")
        }
    
        ProviderState.setRpcProvider(provider);
    } catch (error) {
        console.error("Failed to initialize RPC provider:", error);
        throw error;
    }
};

/**
 * Loads the RPC provider and returns a proxy for the latest provider instance.
 * @returns {Promise<Provider>}
 */
const loadRpc = async () => {
    let cached = ProviderState.getRpcProvider();
    if(cached) return cached;

    /** @type {HTMLInputElement | null} */
    const rpcInput = document.getElementById('rpc-input');
    /** @type {HTMLButtonElement | null} */
    const rpcButton = document.getElementById('rpc-button');

    if (!rpcInput || !rpcButton) {
        console.error("Missing expected DOM elements for RPC setup.");
        return null;
    }

    // Setup listeners that reset provider
    rpcInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            setupProvider(rpcInput.value);
        }
    });
    rpcButton.addEventListener('click', () => setupProvider(rpcInput.value));


    await setupProvider(rpcInput.value);

    const res = ProviderState.getRpcProvider()
    if(!res) throw new Error("no provider")

    return res
};

export { loadRpc }
