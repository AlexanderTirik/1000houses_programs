
use anchor_lang::prelude::*;
use anchor_spl::{token::{self, Mint, Token, TokenAccount}, associated_token::AssociatedToken};
use crate::types::*;

pub fn stake(
    ctx: Context<Stake>,
    amount: u64,
) -> Result<()> {
    let last_reward_index = ctx.accounts.stake_pda.last_reward_index;
    let current_reward_index = ctx.accounts.data_pda.current_reward_index;
    if last_reward_index != current_reward_index {
        ctx.accounts.stake_pda.last_reward_index = ctx.accounts.data_pda.current_reward_index;
        ctx.accounts.stake_pda.stacked = 0;
    }
    ctx.accounts.data_pda.stacked += amount;
    ctx.accounts.stake_pda.stacked += amount;

    let cpi_ctx: CpiContext<token::Transfer> = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.owner_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
            to: ctx.accounts.stake_token_account.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, amount)?;
    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Stake<'info> {
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    #[account(
        address = TOKEN_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        space = 8 + 1 + 1 + 8,
        payer = owner,
        seeds = [ b"stake".as_ref(), owner.key.as_ref() ],
        bump)]
    pub stake_pda: Account<'info, StakePda>,

    #[account(mut,
        constraint = data_pda.is_stacking_freezed == false,
        seeds = [ b"data".as_ref(), AUTHORITY_ADDRESS.parse::<Pubkey>().unwrap().as_ref() ],
        bump)]
    pub data_pda: Account<'info, Data>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = data_pda,
    )]
    pub stake_token_account: Account<'info, TokenAccount>,

    #[account(mut, has_one = owner, constraint = owner_token_account.mint == token_mint.key() && owner_token_account.amount >= amount)]
    pub owner_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,
}