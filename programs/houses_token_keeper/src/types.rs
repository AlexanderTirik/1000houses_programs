use anchor_lang::prelude::*;

#[account]
pub struct UserPda {
    pub bump: u8
}

pub const TOKEN_MINT_ADDRESS: &str = "HJwEZR9F5TFQjxgPxZ7FtSK8uqUcU9RBS44EkKHiy182";
pub const AUTHORITY_ADDRESS: &str = "8gSejFHC9NdrmoLQnhrf2oqHPEcdNnTDmy1ozqzrrEc1";
