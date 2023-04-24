use anchor_lang::prelude::*;
use anchor_lang::program;

mod types;
mod methods;
use methods::stake::*;
use methods::initialize::*;

declare_id!("DtQ3393mMcz89n339t4VS56veqCyZJgoJw6S1AvwMf3M");

#[program]
pub mod houses {
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

}



