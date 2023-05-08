use anchor_lang::prelude::*;

declare_id!("2bgCfBD4DQKQHNrtRhHMTYisiGyRchvHZGH96iqb7F9x");
mod types;
mod methods;
use methods::output::*;
use methods::stake::*;

#[program]
pub mod houses_token_keeper {
    use super::*;

    pub fn output(ctx: Context<Output>, email: String, amount: u64) -> Result<()> {
        methods::output::output(ctx, email, amount)
    }

    pub fn stake(_ctx: Context<Stake>) -> Result<()> {
        methods::stake::stake()
    }
}
