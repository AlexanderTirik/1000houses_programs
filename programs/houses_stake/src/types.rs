use anchor_lang::prelude::*;

#[account]
pub struct StakePdaTokenAccount {
    pub bump: u8
}
#[account]
pub struct Data {
    pub stacked: u64,
    pub is_stacking_freezed: bool,
    pub bump: u8
}

pub const TOKEN_MINT_ADDRESS: &str = "HJwEZR9F5TFQjxgPxZ7FtSK8uqUcU9RBS44EkKHiy182";
pub const AUTHORITY_ADDRESS: &str = "8gSejFHC9NdrmoLQnhrf2oqHPEcdNnTDmy1ozqzrrEc1";
