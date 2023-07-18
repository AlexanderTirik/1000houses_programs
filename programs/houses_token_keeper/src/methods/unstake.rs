use anchor_lang::{prelude::*};
use anchor_spl::{token::{Mint, Token, TokenAccount}, associated_token::AssociatedToken};
use houses_stake::cpi::accounts::Unstake as CpiUnstake;
use houses_stake::types::{StakePda, Data};
use houses_stake::program::HousesStake;

use crate::types::*;

pub fn unstake(ctx: Context<Unstake>, email: String, amount: u64
) -> Result<()> {
    let stake_program = ctx.accounts.stake_program.to_account_info();
    let seeds = &[email.as_ref(), ctx.accounts.authority.key.as_ref(), &[*ctx.bumps.get("user_pda").unwrap()]];
    let signer = &[&seeds[..]];
    let cpi_accounts = CpiUnstake {
        token_program: ctx.accounts.token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        associated_token_program: ctx.accounts.associated_token_program.to_account_info(),
        token_mint: ctx.accounts.token_mint.to_account_info(),
        stake_pda: ctx.accounts.stake_pda.to_account_info(),
        stake_pda_token_account: ctx.accounts.stake_pda_token_account.to_account_info(),
        data_pda: ctx.accounts.data_pda.to_account_info(),
        owner_token_account: ctx.accounts.user_pda_token_account.to_account_info(),
        owner: ctx.accounts.user_pda.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(stake_program, cpi_accounts, signer);
    houses_stake::cpi::unstake(cpi_ctx, amount)?;
    Ok(())
    }

#[derive(Accounts)]
#[instruction(email: String)]
pub struct Unstake<'info> {
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(
        address = STAKE_PROGRAM_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub stake_program: Program<'info, HousesStake>,

    #[account(mut,
        address = TOKEN_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(init_if_needed,
        space = 8 + 1,
        payer = authority,
        // constraint rethink
        seeds = [ email.as_ref(), authority.key.as_ref() ],
        bump)]
    pub user_pda: Account<'info, UserPda>,

    #[account(mut,
        associated_token::mint = token_mint,
        associated_token::authority = user_pda
    )]
    pub user_pda_token_account: Account<'info, TokenAccount>,

    #[account()]
    pub stake_pda: Account<'info, StakePda>,

    #[account(
        init_if_needed,
        payer = authority, 
        associated_token::mint = token_mint,
        associated_token::authority = stake_pda
    )]
    pub stake_pda_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub data_pda: Account<'info, Data>,

    #[account(mut,
        address = AUTHORITY_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub authority: Signer<'info>,
}
