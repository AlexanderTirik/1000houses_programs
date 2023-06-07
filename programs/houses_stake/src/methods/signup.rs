
use anchor_lang::prelude::*;
use crate::types::*;

pub fn signup(
) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct Signup<'info> {
    pub system_program: Program<'info, System>,

    #[account(
        init,
        space = 8 + 1 + 1,
        payer = authority,
        // constraint = pda_token_account.owner == *stake_pda.key, // rethink
        seeds = [ b"stake".as_ref(), user_pda.key().as_ref() ],
        bump)]
    pub stake_pda: Account<'info, StakePda>,
 
 /// CHECK
    #[account(mut)]
    pub user_pda: UncheckedAccount<'info>,

    #[account(mut,
        address = AUTHORITY_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub authority: Signer<'info>,
}