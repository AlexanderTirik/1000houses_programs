use anchor_lang::prelude::*;
use crate::types::*;

pub fn update_freeze(ctx: Context<Freeze>, state: bool) -> Result<()> {
    ctx.accounts.data_pda.is_stacking_freezed = state;
    Ok(())
}

#[derive(Accounts)]
pub struct Freeze<'info> {
    #[account(mut,
        seeds = [ b"data".as_ref(), user.key.as_ref() ],
        bump)]
    pub data_pda: Account<'info, Data>,
    #[account(mut)]
    pub user: Signer<'info>,
}
