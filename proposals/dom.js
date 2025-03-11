import { castVote, getAllProposals, getLatestBlock } from '../eth/index.js';
import { loadRpc } from '../rpc/dom.js';
import { loadMetamask } from '../wallet/index.js';

/**
 * Creates and returns a proposal DOM element based on the provided proposal data.
 *
 * @param {Object} proposal The proposal data.
 * @param {bigint} latestL1Block The latest L1 block number.
 * @param {HTMLTemplateElement} template The template element to clone.
 * @returns {{ element: DocumentFragment, isActive: boolean }} The proposal element and its active status.
 */
const createProposalElement = (proposal, isActive, template) => {
    const clone = template.content.cloneNode(true);

    const infoEl = clone.querySelector(".proposal-info");
    infoEl.innerText = `id: 0x${proposal.proposalId.toString(16)}`;

    const toggleBtn = clone.querySelector(".toggle-details");
    const detailsEl = clone.querySelector(".details");
    let detailsVisible = false;
    toggleBtn.onclick = () => {
        detailsVisible = !detailsVisible;
        detailsEl.style.display = detailsVisible ? "block" : "none";
        if (detailsVisible) {
            detailsEl.textContent = JSON.stringify(proposal, null, 2);
        }
    };

    // If active, display vote options and set up unique radio buttons
    const voteOptionsEl = clone.querySelector(".vote-options");
    if (isActive) {
        voteOptionsEl.style.display = "block";

        // Make radio buttons and labels unique by using the proposalId
        const uniqueSuffix = proposal.proposalId.toString(16);
        const radioYes = clone.querySelector(".vote-yes");
        const radioNo = clone.querySelector(".vote-no");
        const radioAbstain = clone.querySelector(".vote-abstain");
        const labelYes = clone.querySelector(`label[for^="vote-yes-"]`);
        const labelNo = clone.querySelector(`label[for^="vote-no-"]`);
        const labelAbstain = clone.querySelector(`label[for^="vote-abstain-"]`);

        radioYes.id = `vote-yes-${uniqueSuffix}`;
        radioNo.id = `vote-no-${uniqueSuffix}`;
        radioAbstain.id = `vote-abstain-${uniqueSuffix}`;
        radioYes.name = `voteOption-${uniqueSuffix}`;
        radioNo.name = `voteOption-${uniqueSuffix}`;
        radioAbstain.name = `voteOption-${uniqueSuffix}`;
        labelYes.htmlFor = radioYes.id;
        labelNo.htmlFor = radioNo.id;
        labelAbstain.htmlFor = radioAbstain.id;

        // Set up vote button functionality if needed
        const voteButton = clone.querySelector(".vote");
        voteButton.onclick = async () => {
            const wallet = await loadMetamask();
            console.log(`Voting on proposal ${proposal.proposalId}`);
            await castVote(wallet)
        };
    }

    return clone;
};


/**
 * Loads proposals and appends their elements to the appropriate DOM lists.
 */
const loadProposals = async () => {
    const activePropList = document.getElementById("active-prop-list");
    const inactivePropList = document.getElementById("inactive-prop-list");

    if (!activePropList || !inactivePropList) {
        console.error("Missing required DOM elements.");
        return;
    }

    const provider = await loadRpc();
    const proposals = await getAllProposals(provider);
    const latestBlock = await getLatestBlock(provider);
    const latestL1Block = BigInt(latestBlock.l1BlockNumber);

    const template = document.getElementById("proposal-template");
    if (!template) {
        console.error("Missing proposal template.");
        throw new Error("missing proposal template")
    }

    for (const proposal of proposals) {
        const isActive = proposal.endBlock > latestL1Block;
        const element = createProposalElement(proposal, isActive, template);

        if (isActive) {
            activePropList.appendChild(element);
        } else {
            inactivePropList.appendChild(element);
        }
    }
};

export { loadProposals };
