
### Design goals

 - secure, lean UI for locally managing stuff
    - assume user on modern browser
 - Minimal attack surface
    - No dependencies, no framework, no fancy stuff
    - local first, self-hosted (no dns)
        - no build process (easier for people to self host and for ipfs)
 - Maximise public verifiability
    - simple modern es6 js, no framework, no esoteric functionality/syntax
 - Decent usability
    - UX won't be flashy but it need to be usable to avoid user error
    - Not highly performant, but not slow to the point where not usable
    - no DB. only app storage in browser
 - Narrow functionality (do minimal needed, no generalisations)
    - view/vote arbitrum governance proposals
    - view/vote arbitrum security council elections
    - support MetaMask wallet api

#### functionality

Governance proposals
 - [ ] fetch proposal created eth events in range based on date
 - [ ] parse proposal description ( ensure no xss vuln )
 - [ ] vote in proposal
 - [ ] view other votes in proposal

Security Council elections
 - [ ] fetch nominees election initiated eth events in range based on date
 - [ ] sign up as a nominee for election
 - [ ] vote in nominees
 - [ ] view other votes in nominees
 - [ ] view if veto wallet did anything inbetween
 - [ ] fetch member election initiated eth events in range based on date
 - [ ] vote in member
 - [ ] view other votes in member
 

General affordances
 - [ ] connect to metamask
 - [ ] initiate metamask tx
 - [ ] request metamask signature
 - [ ] easily verify expected blind signing hash
 - [ ] connect to self provided rpc url
 - [ ] cache events in local app storage
 - [ ] flush events cache
 - [ ] export json for SAFE's tx builder


 Robustness affordances for after
 - [ ] view current quorum and necessary quorum (governance and sc elections)
 - [ ] view if proposalThreshold changed


#### to consider

 - support other major wallets (maybe wallet connect?)
 - view/sign SAFE transactions (maybe initiate with wallet connect?) easier to just support tx builder json stndrd
 - allow app storage data download (local manual json db) and to load
 - download json db together with website repo
    - github actions verify its correct on PRs
    - button for UI to verify locally
 - ipfs CID hash in repo
   - script to generate CID
   - verify in github PRs
   - button to verify in UI
 - have a js impl of keccak256 instead of querying onchain smart contract lmao

#### risks

 - mistakes since reimplemented a lot of stuff
 - user error given rudimentary UX

