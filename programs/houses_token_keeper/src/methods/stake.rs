use anchor_lang::prelude::*;

use crate::types::*;

pub fn stake() -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut,
        address = AUTHORITY_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub authority: Signer<'info>,
}
