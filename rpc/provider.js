
import { getChainId, isChainSupported } from "../eth/index.js"


/**
 * @typedef {Object} Provider - Object to interface with chain
 * @property {(options: { method: string; params?: any[] }) => Promise<any>} [request] - Initiate RPC request
 */

/**
 * @param {string} rpcUrl 
 * @returns {Provider}
 */
const createRpcProvider = async (rpcUrl) => {
    const request = async (options) => {
        const { method, params } = options;

        const data = {
            jsonrpc: "2.0",
            method,
            params: params || [],
            id: 1
        };

        const maxRetries = 5;
        let attempt = 0;
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        while (attempt < maxRetries) {
            try {
                const response = await fetch(rpcUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    throw new Error(`Network response was not ok: ${response.statusText}`);
                }

                return await response.json().then((res) => res.result);
            } catch (error) {
                attempt++;
                if (attempt >= maxRetries) {
                    console.error('Max retries reached. RPC Request Error:', error);
                    throw error;
                }

                const backoffTime = 2 ** attempt * 100; // Exponential backoff (100ms, 200ms, 400ms, etc.)
                console.warn(`Retrying RPC request... Attempt ${attempt} after ${backoffTime}ms.`);
                await delay(backoffTime);
            }
        }
        throw new Error("failed too many times attempting rpc. something is wrong")
    };

    /** @type {Provider} */
    const provider = { request };

    const chainId = await getChainId(provider);

    if (!isChainSupported(chainId)) {
        console.log("chain not supported")
        return undefined
    }

    return provider;
};


export { createRpcProvider }
