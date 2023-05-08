use anchor_lang::prelude::*;
use anchor_spl::{token::{Mint, Token, TokenAccount, self}, associated_token::AssociatedToken};

use crate::types::*;

pub fn output(ctx: Context<Output>, email: String, amount: u64) -> Result<()> {
    let seeds = &[email.as_ref(), ctx.accounts.authority.key.as_ref(), &[*ctx.bumps.get("user_pda").unwrap()]];
    let signer = &[&seeds[..]];
    let cpi_ctx: CpiContext<token::Transfer> = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        token::Transfer {
            from: ctx.accounts.user_pda_token_account.to_account_info(),
            authority: ctx.accounts.user_pda.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
        },
        signer,
    );
    token::transfer(cpi_ctx, amount)?;
    Ok(())
}

#[derive(Accounts)]
#[instruction(email: String)]
pub struct Output<'info> {
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,

    #[account(
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
    pub recipient: SystemAccount<'info>,

    #[account(mut,
        associated_token::mint = token_mint,
        associated_token::authority = recipient
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(mut,
        address = AUTHORITY_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub authority: Signer<'info>,
}
