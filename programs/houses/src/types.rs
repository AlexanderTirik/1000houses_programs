use anchor_lang::prelude::*;

#[account]
pub struct StakePdaTokenAccount {
    pub bump: u8
}
#[account]
pub struct Data {
    pub stacked: u64,
    pub bump: u8
}

pub const TOKEN_MINT_ADDRESS: &str = "28wv75f7w4dAeTRbBYKYWuLZwnzXPhrVN7jeRAm19Q4J";
