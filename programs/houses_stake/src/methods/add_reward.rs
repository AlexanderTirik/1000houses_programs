use anchor_lang::prelude::*;
use anchor_spl::{token::{Token, TokenAccount, self}, associated_token::AssociatedToken};
use crate::types::*;

pub fn add_reward(ctx: Context<AddReward>, amount: u64) -> Result<()> {
    let cpi_ctx: CpiContext<token::Transfer> = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.authority_token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
            to: ctx.accounts.reward_token_account.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, amount)?;
    ctx.accounts.data_pda.current_reward_index = (ctx.accounts.data_pda.current_reward_index + 1) % 255;
    ctx.accounts.data_pda.current_reward = amount;
    ctx.accounts.data_pda.stacked = 0;
    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct AddReward<'info> {
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    #[account(mut,
        seeds = [ b"data".as_ref(), authority.key.as_ref() ],
        bump)]
    pub data_pda: Account<'info, Data>,

    #[account(
        mut,
        associated_token::mint = REWARD_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
        associated_token::authority = data_pda
    )]
    pub reward_token_account: Account<'info, TokenAccount>,

    #[account(mut,
        associated_token::mint = REWARD_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
        constraint = authority_token_account.amount >= amount,
        associated_token::authority = authority)]
    pub authority_token_account: Account<'info, TokenAccount>,

    #[account(address = AUTHORITY_ADDRESS.parse::<Pubkey>().unwrap())]
    pub authority: Signer<'info>,
}
