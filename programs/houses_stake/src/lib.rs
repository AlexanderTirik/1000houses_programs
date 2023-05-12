use anchor_lang::prelude::*;
use anchor_lang::program;

pub mod types;
mod methods;
use methods::stake::*;
use methods::initialize::*;
use methods::update_freeze::*;
use methods::unstake::*;
use methods::signup::*;

declare_id!("GBcstHFNnGBqBpiZfurPDZJoousWxYZBfUyAipYbRUXc");

#[program]
pub mod houses_stake {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        methods::initialize::initialize(ctx)
    }

    pub fn stake(
        ctx: Context<Stake>,
        _pda_key: String,
        amount: u64,
    ) -> Result<()> {
        methods::stake::stake(ctx, amount)
    }

    pub fn update_freeze(
        ctx: Context<Freeze>,
        state: bool,
    ) -> Result<()> {
        methods::update_freeze::update_freeze(ctx, state)
    }

    pub fn unstake(
        ctx: Context<Unstake>,
        pda_key: String,
        amount: u64,
    ) -> Result<()> {
        methods::unstake::unstake(ctx, pda_key, amount)
    }

    pub fn signup(
        _ctx: Context<Signup>,
        _pda_key: String
    ) -> Result<()> {
        methods::signup::signup()
    }

}



