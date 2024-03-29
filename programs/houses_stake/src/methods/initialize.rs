use anchor_lang::prelude::*;
use anchor_spl::{token::{Mint, TokenAccount, Token}, associated_token::AssociatedToken};
use crate::types::*;

pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    ctx.accounts.data_pda.stacked = 0;
    ctx.accounts.data_pda.previous_stacked = 0;
    ctx.accounts.data_pda.reward_index = 0;
    ctx.accounts.data_pda.reward = 0;
    ctx.accounts.data_pda.is_stacking_freezed = false;
    ctx.accounts.data_pda.bump = *ctx.bumps.get("data_pda").unwrap();
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    #[account(
        address = TOKEN_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        address = REWARD_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub reward_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = user, 
        associated_token::mint = token_mint,
        associated_token::authority = data_pda,
    )]
    pub stake_token_account: Account<'info, TokenAccount>,
    
    #[account(init,
        space = 8 + 8 + 8 + 1 + 1 + 8 + 1,
        payer = user,
        seeds = [ b"data".as_ref(), user.key.as_ref() ],
        bump)]
    pub data_pda: Account<'info, Data>,

    #[account(
        init,
        payer = user, 
        associated_token::mint = reward_mint,
        associated_token::authority = data_pda
    )]
    pub reward_token_account: Account<'info, TokenAccount>,

    #[account(mut, address = AUTHORITY_ADDRESS.parse::<Pubkey>().unwrap())]
    pub user: Signer<'info>,
}
