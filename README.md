This is 1000houses token stake program

This program created for staking 1000houses token

To work with this program, you need to install:

- solana-cli
- solana-test-validator
- rust
- node
- anchor-cli
- yarn

To run test, you need to install dependencies first:

`yarn install`

Then run local test validator

`solana-test-validator -r`

`yarn create-test-mint`

Replace created mint in types.rs

And run tests `anchor test --skip-local-validator`
