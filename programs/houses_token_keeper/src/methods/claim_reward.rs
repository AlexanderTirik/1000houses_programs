use anchor_lang::prelude::*;
use anchor_spl::{token::{Mint, Token, TokenAccount}, associated_token::AssociatedToken};
use houses_stake::cpi::accounts::ClaimReward as CpiClaimReward;
use houses_stake::types::{StakePda, Data};
use houses_stake::program::HousesStake;

use crate::types::*;

pub fn claim_reward(ctx: Context<ClaimReward>, email: String) -> Result<()> {
    let stake_program = ctx.accounts.stake_program.to_account_info();
    let seeds = &[email.as_ref(), ctx.accounts.authority.key.as_ref(), &[*ctx.bumps.get("user_pda").unwrap()]];
    let signer = &[&seeds[..]];
    let cpi_accounts = CpiClaimReward {
        token_program: ctx.accounts.token_program.to_account_info(),
        system_program: ctx.accounts.system_program.to_account_info(),
        associated_token_program: ctx.accounts.associated_token_program.to_account_info(),
        token_mint: ctx.accounts.token_mint.to_account_info(),
        reward_mint: ctx.accounts.reward_mint.to_account_info(),
        stake_pda: ctx.accounts.stake_pda.to_account_info(),
        data_pda: ctx.accounts.data_pda.to_account_info(),
        reward_token_account: ctx.accounts.reward_token_account.to_account_info(),
        user_reward_token_account: ctx.accounts.user_reward_token_account.to_account_info(),
        user: ctx.accounts.user_pda.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(stake_program, cpi_accounts, signer);
    houses_stake::cpi::claim_reward(cpi_ctx)?;
    Ok(())
    }

#[derive(Accounts)]
#[instruction(email: String)]
pub struct ClaimReward<'info> {
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    #[account(
        address = STAKE_PROGRAM_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub stake_program: Program<'info, HousesStake>,

    #[account(
        address = TOKEN_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        address = REWARD_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub reward_mint: Account<'info, Mint>,

    #[account(mut)]
    pub stake_pda: Account<'info, StakePda>,

    #[account(mut)]
    pub data_pda: Account<'info, Data>,

    #[account(
        mut,
        associated_token::mint = reward_mint,
        associated_token::authority = data_pda
    )]
    pub reward_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = reward_mint,
        associated_token::authority = user_pda)]
    pub user_reward_token_account: Account<'info, TokenAccount>,

    #[account(init_if_needed,
        space = 8 + 1,
        payer = authority,
        // constraint rethink
        seeds = [ email.as_ref(), authority.key.as_ref() ],
        bump)]
    pub user_pda: Account<'info, UserPda>,

    #[account(mut,
        address = AUTHORITY_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub authority: Signer<'info>,
}
