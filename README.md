# b9labs-eth20-proj2

You will create a smart contract named Remittance whereby:

- there are three people: Alice, Bob & Carol.
- Alice wants to send funds to Bob, but she only has ether & Bob wants to be paid in local currency.
- luckily, Carol runs an exchange shop that converts ether to local currency.

Therefore, to get the funds to Bob, Alice will allow the funds to be transferred through Carol's exchange shop. Carol will collect the ether from Alice and give the local currency to Bob.

The steps involved in the operation are as follows:

- Alice creates a Remittance contract with Ether in it and a puzzle.
- Alice sends a one-time-password to Bob; over SMS, say.
- Alice sends another one-time-password to Carol; over email, say.
- Bob treks to Carol's shop.
- Bob gives Carol his one-time-password.
- Carol submits both passwords to Alice's remittance contract.
- Only when both passwords are correct, the contract yields the Ether to Carol.
- Carol gives the local currency to Bob.
- Bob leaves.
- Alice is notified that the transaction went through.
- Since they each have only half of the puzzle, Bob & Carol need to meet in person so they can supply both passwords to the contract. This is a security measure. It may help to understand this use-case as similar to a 2-factor authentication.

Stretch goals:

- add a deadline, after which Alice can claim back the unchallenged Ether
- add a limit to how far in the future the deadline can be
- add a kill switch to the whole contract
- plug a security hole (which one?) by changing one password to the recipient's address
- make the contract a utility that can be used by David, Emma and anybody with an address
- make you, the owner of the contract, take a cut of the Ethers smaller than what it would cost Alice to deploy the same contract herself

# Use cases

## Initialization

- Sender/recipient opens dapp and connects it to a ethereum client.
- Dapp displays live network status, sender address, and balance.

## New remittance

- Sender clicks on 'Send remittance'. Dapp prompts for recipient address, amount, OTP.
- User fills in these fields and submits remittance.
- Dapp sends remittance creation transaction to the network.
- Plain OTP never sent to the network.

## View pending sent remittances

- 

## Claim

- Sender treks to recipient and hands him over OTP.
- Recipient clicks 'Claim'. Dapp prompts for OTP.
- Recipient enters OTP. Dapp sends claim transaction (containing OTP hash) to the network, not disclosing OTP.

## Revoke

- Dapp snows sender a list of issued remittances (for this sender or everybody). Including pending/mined status.
- Sender can click on mined unclaimed remittance and revoke it.

- Dapp show a live list unclaimed remittances (for this recipient or everybody).
- Sender clicks on an unclaimed mined remittance to claim ether back.
