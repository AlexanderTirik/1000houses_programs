use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount};

declare_id!("DtQ3393mMcz89n339t4VS56veqCyZJgoJw6S1AvwMf3M");

#[program]
pub mod houses {
    pub const TOKEN_MINT_ADDRESS: &str = "B4PHSEqQ9bvs2UFeEZfZPjZFL3GQdF2e8oPisCL3ZC6T";
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.data_pda.stacked = 0;
        ctx.accounts.data_pda.bump = *ctx.bumps.get("data_pda").unwrap();
        Ok(())
    }
    pub fn stake(
        ctx: Context<Stake>,
        _pda_key: String,
        amount: u64,
    ) -> Result<()> {

        ctx.accounts.data_pda.stacked += amount;
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            token::Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.stake_pda_token_account.to_account_info(),
            }
        );
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }

}


#[derive(Accounts)]
pub struct Initialize<'info> {
    pub system_program: Program<'info, System>,
    #[account(init,
        space = 8 + 1 + 8,
        payer = user,
        // constraint = pda_token_account.owner == *stake_pda.key, // rethink
        seeds = [ b"data".as_ref() ],
        bump)]
    pub data_pda: Account<'info, Data>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(pda_key: String )]
pub struct Stake<'info> {
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, System>,

    #[account(
        address = TOKEN_MINT_ADDRESS.parse::<Pubkey>().unwrap(),
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        space = 1 + 8,
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
        // constraint = pda_token_account.owner == *stake_pda.key, // rethink
        seeds = [ b"data".as_ref() ],
        bump)]
    pub data_pda: Account<'info, Data>,

    #[account(mut)]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user: Signer<'info>,
}

#[account]
pub struct StakePdaTokenAccount {
    bump: u8
}
#[account]
pub struct Data {
    stacked: u64,
    bump: u8
}
#[derive(Accounts)]
pub struct Empty {}