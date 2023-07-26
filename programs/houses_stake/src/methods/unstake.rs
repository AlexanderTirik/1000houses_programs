use anchor_lang::prelude::*;
use anchor_spl::{token::{self, Mint, Token, TokenAccount}, associated_token::AssociatedToken};
use crate::types::*;

pub fn unstake(
    ctx: Context<Unstake>,
    amount: u64,
) -> Result<()> {
    ctx.accounts.data_pda.stacked -= amount;
    ctx.accounts.stake_pda.stacked -= amount;
    let authority_key = AUTHORITY_ADDRESS.parse::<Pubkey>().unwrap();

    let seeds = &[b"data".as_ref(), authority_key.as_ref(), &[*ctx.bumps.get("data_pda").unwrap()]];

    let signer = &[&seeds[..]];
    let cpi_ctx: CpiContext<token::Transfer> = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.stake_token_account.to_account_info(),
            authority: ctx.accounts.data_pda.to_account_info(),
            to: ctx.accounts.owner_token_account.to_account_info(),
        },
        signer,
    );
    token::transfer(cpi_ctx, amount)?;
    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64)]
pub struct Unstake<'info> {
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    #[account(mut,
        address = TOKEN_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [ b"stake".as_ref(), owner.key.as_ref() ],
        constraint = stake_pda.last_reward_index == data_pda.current_reward_index && amount <= data_pda.stacked,
        bump)]
    pub stake_pda: Account<'info, StakePda>,

    #[account(
        mut,
        associated_token::mint = token_mint,
        associated_token::authority = data_pda,
    )]
    pub stake_token_account: Account<'info, TokenAccount>,

    #[account(mut,
        constraint = data_pda.is_stacking_freezed == false,
        seeds = [ b"data".as_ref(), AUTHORITY_ADDRESS.parse::<Pubkey>().unwrap().as_ref() ],
        bump)]
    pub data_pda: Account<'info, Data>,

    #[account(mut, has_one=owner, constraint = owner_token_account.mint == token_mint.key())]
    pub owner_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,
}