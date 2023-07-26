use anchor_lang::prelude::*;

declare_id!("2bgCfBD4DQKQHNrtRhHMTYisiGyRchvHZGH96iqb7F9x");
mod types;
mod methods;
use methods::output::*;
use methods::stake::*;
use methods::unstake::*;
use methods::claim_reward::*;

#[program]
pub mod houses_token_keeper {
    use super::*;

    pub fn output(ctx: Context<Output>, email: String, amount: u64) -> Result<()> {
        methods::output::output(ctx, email, amount)
    }

    pub fn stake(ctx: Context<Stake>, email: String, amount: u64) -> Result<()> {
        methods::stake::stake(ctx, email, amount)
    }

    pub fn unstake(ctx: Context<Unstake>, email: String, amount: u64) -> Result<()> {
        methods::unstake::unstake(ctx, email, amount)
    }

    pub fn claim_reward(ctx: Context<ClaimReward>, email: String) -> Result<()> {
        methods::claim_reward::claim_reward(ctx, email)
    }
}
