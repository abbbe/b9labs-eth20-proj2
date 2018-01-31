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
- Dapp shows links to
    - New Remittance,
    - My Remittances,
    - Find Claim,
    - My Claims.

## New Remittance

- Dapp prompts for recipient address, amount, and OTP.
- Sender fills in these fields and clicks 'New Remittance'.
- Dapp sends remittance transaction.

See Tx Progress.

## Find Claim

- Dapp prompts for OTP.
- Recipient fills in OTP and clicks 'Find'
- Dapp finds the remittance, shows details (timestamp, sender, recipient, amount).
- If recipient address matches, Dapp shows 'Claim' button.
- Recipient clicks on 'Claim'.
- Dapp sends claim transaction.

See Tx Progress.

## My Remittances

- Dapp snows sender a live list of remittances (pending, mined, claimed, revoked).
- For mined (unclaimed, unrevoked) transactions Dapp shows 'Revoke' button.

## Revoke
- Sender clicks on 'Revoke next to an unclaimed mined remittance.
- Dapp shows details (timestamp, recipient, amount) dialog.
- Sender clicks 'Confirm Revoke'.
- Dapp sends revoke transaction.

See Tx Progress.

## ... Tx Progress

This screen opens after transaction is created by use cases above.

- Dapp shows network status and status of recently submitted transaction.
- User can close the window and go back to home screen (and back to My Remittances / My Claims) 

## My Claims

- Dapp shows a live list of claims (pending, mined, failed).
