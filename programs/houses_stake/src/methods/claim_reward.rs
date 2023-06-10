use anchor_lang::prelude::*;
use anchor_spl::{token::{Mint, Token, TokenAccount, self}, associated_token::AssociatedToken};
use crate::types::*;

pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
    let mut sum = 0;
    let start_index = ctx.accounts.stake_pda.last_reward as usize + 1;
    let end_index = ctx.accounts.data_pda.current_reward as usize + 1;
    for i in start_index..end_index {
        let percent = ctx.accounts.stake_pda_token_account.amount as f32 / ctx.accounts.data_pda.stacked_history[i] as f32;
        sum += (ctx.accounts.data_pda.rewards_history[i] as f32 * percent).floor() as u64;
    }
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
    token::transfer(cpi_ctx, sum)?;

    ctx.accounts.stake_pda.last_reward = ctx.accounts.data_pda.current_reward;
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
        // constraint = pda_token_account.owner == *stake_pda.key, // rethink
        seeds = [ b"stake".as_ref(), user.key.as_ref() ],
        bump)]
    pub stake_pda: Account<'info, StakePda>,

    #[account(
        associated_token::mint = token_mint,
        associated_token::authority = stake_pda
    )]
    pub stake_pda_token_account: Account<'info, TokenAccount>,

    #[account(mut,
        seeds = [ b"data".as_ref(), AUTHORITY_ADDRESS.parse::<Pubkey>().unwrap().as_ref() ],
        bump)]
    pub data_pda: Account<'info, Data>,

    #[account(
        mut,
        associated_token::mint = reward_mint,
        associated_token::authority = data_pda
    )]
    pub reward_token_account: Account<'info, TokenAccount>,
    // add constraint to check balance
    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = reward_mint,
        associated_token::authority = user)]
    pub user_reward_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
}
