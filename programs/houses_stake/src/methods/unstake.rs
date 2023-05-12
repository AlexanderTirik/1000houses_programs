use anchor_lang::prelude::*;
use anchor_spl::{token::{self, Mint, Token, TokenAccount}, associated_token::AssociatedToken};
use crate::types::*;

pub fn unstake(
    ctx: Context<Unstake>,
    pda_key: String,
    amount: u64,
) -> Result<()> {
    ctx.accounts.data_pda.stacked -= amount;
    let seeds = &[pda_key.as_ref(), ctx.accounts.user.key.as_ref(), &[*ctx.bumps.get("stake_pda").unwrap()]];

    let signer = &[&seeds[..]];
    let cpi_ctx: CpiContext<token::Transfer> = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.stake_pda_token_account.to_account_info(),
            authority: ctx.accounts.stake_pda.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
        },
        signer,
    );
    token::transfer(cpi_ctx, amount)?;
    Ok(())
}

#[derive(Accounts)]
#[instruction(pda_key: String, amount: u64)]
pub struct Unstake<'info> {
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    #[account(mut,
        address = TOKEN_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        address = AUTHORITY_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub authority: SystemAccount<'info>,

    #[account(
        // constraint = pda_token_account.owner == *stake_pda.key, // rethink
        seeds = [ pda_key.as_ref(), user.key.as_ref() ],
        bump)]
    pub stake_pda: Account<'info, StakePda>,

    #[account(
        mut,
        associated_token::mint = token_mint, 
        associated_token::authority = stake_pda,
        constraint = stake_pda_token_account.amount >= amount,
    )]
    pub stake_pda_token_account: Account<'info, TokenAccount>,

    #[account(mut,
        constraint = data_pda.is_stacking_freezed == false,
        seeds = [ b"data".as_ref(), authority.key().as_ref() ],
        bump)]
    pub data_pda: Account<'info, Data>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
}