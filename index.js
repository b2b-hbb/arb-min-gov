'use strict';

import { loadRpc } from "./rpc/index.js"
import { loadMetamask } from "./wallet/index.js"
import { loadProposals } from "./proposals/index.js"

BigInt.prototype.toJSON = function() { return this.toString(); };

document.addEventListener('DOMContentLoaded', async () => {
    // no need to block on this, so we don't await
    // TODO: they get called repeatedly inside. might need to create a "isFetching" state to signal there is no cache, but soon there will be
    loadRpc();
    loadMetamask();

    // we want to load proposals before printing done, so we await
    await loadProposals();
    
    console.log("done");
});

