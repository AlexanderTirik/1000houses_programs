use anchor_lang::prelude::*;
use anchor_spl::{token::{Mint, Token, TokenAccount, self}, associated_token::AssociatedToken};
use crate::types::*;

pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
    let authority_key = AUTHORITY_ADDRESS.parse::<Pubkey>().unwrap();
    let seeds = &[b"data".as_ref(), authority_key.as_ref(), &[*ctx.bumps.get("data_pda").unwrap()]];
    let signer = &[&seeds[..]];
    let cpi_ctx: CpiContext<token::Transfer> = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.reward_token_account.to_account_info(),
            authority: ctx.accounts.data_pda.to_account_info(),
            to: ctx.accounts.user_reward_token_account.to_account_info(),
        },
        signer
    );

    let percent = ctx.accounts.stake_pda.stacked as f32 / ctx.accounts.data_pda.previous_stacked as f32;
    let reward = (ctx.accounts.data_pda.previous_reward as f32 * percent).floor() as u64;

    token::transfer(cpi_ctx, reward)?;
    ctx.accounts.stake_pda.stacked = 0;
    Ok(())
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    #[account(
        address = REWARD_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub reward_mint: Account<'info, Mint>,

    #[account(
        address = TOKEN_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        constraint = stake_pda.last_reward_index + 1 == data_pda.current_reward_index && stake_pda.stacked > 0,
        seeds = [ b"stake".as_ref(), user.key.as_ref() ],
        bump)]
    pub stake_pda: Account<'info, StakePda>,

    #[account(mut,
        seeds = [ b"data".as_ref(), AUTHORITY_ADDRESS.parse::<Pubkey>().unwrap().as_ref() ],
        bump)]
    pub data_pda: Account<'info, Data>,

    // add constraint to check balance
    #[account(
        mut,
        associated_token::mint = reward_mint,
        associated_token::authority = data_pda
    )]
    pub reward_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = reward_mint,
        associated_token::authority = user)]
    pub user_reward_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
}
