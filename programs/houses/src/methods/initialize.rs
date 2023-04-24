use anchor_lang::prelude::*;
use crate::types::*;

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    ctx.accounts.data_pda.stacked = 0;
    ctx.accounts.data_pda.bump = *ctx.bumps.get("data_pda").unwrap();
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    pub system_program: Program<'info, System>,
    #[account(init,
        space = 8 + 1 + 8,
        payer = user,
        // constraint = pda_token_account.owner == *stake_pda.key, // rethink
        seeds = [ b"data".as_ref() ],
        bump)]
    pub data_pda: Account<'info, Data>,
    #[account(mut)]
    pub user: Signer<'info>,
}
