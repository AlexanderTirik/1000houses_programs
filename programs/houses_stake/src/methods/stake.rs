
use anchor_lang::prelude::*;
use anchor_spl::{token::{self, Mint, Token, TokenAccount}, associated_token::AssociatedToken};
use crate::types::*;

pub fn stake(
    ctx: Context<Stake>,
    amount: u64,
) -> Result<()> {

    ctx.accounts.data_pda.stacked += amount;
    
    let cpi_ctx: CpiContext<token::Transfer> = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
            to: ctx.accounts.stake_pda_token_account.to_account_info(),
        },
    );
    token::transfer(cpi_ctx, amount)?;
    Ok(())
}

#[derive(Accounts)]
#[instruction(pda_key: String )]
pub struct Stake<'info> {
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    #[account(
        address = TOKEN_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        address = AUTHORITY_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub authority: SystemAccount<'info>,

    #[account(
        init_if_needed,
        space = 8 + 1,
        payer = user,
        // constraint = pda_token_account.owner == *stake_pda.key, // rethink
        seeds = [ pda_key.as_ref(), user.key.as_ref() ],
        bump)]
    pub stake_pda: Account<'info, StakePdaTokenAccount>,

    #[account(
        init_if_needed,
        payer = user, 
        associated_token::mint = token_mint,
        associated_token::authority = stake_pda
    )]
    pub stake_pda_token_account: Account<'info, TokenAccount>,

    #[account(mut,
        constraint = data_pda.is_stacking_freezed == false, // u
        seeds = [ b"data".as_ref(), authority.key().as_ref() ],
        bump)]
    pub data_pda: Account<'info, Data>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
}