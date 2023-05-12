use anchor_lang::prelude::*;

#[account]
pub struct UserPda {
    pub bump: u8
}

pub const TOKEN_MINT_ADDRESS: &str = "C5cvu4AraQ1svw9gZGTfkjLxfvTUFTajHGHXFBM2b8mJ";
pub const AUTHORITY_ADDRESS: &str = "8gSejFHC9NdrmoLQnhrf2oqHPEcdNnTDmy1ozqzrrEc1";
pub const STAKE_PROGRAM_ADDRESS: &str = "GBcstHFNnGBqBpiZfurPDZJoousWxYZBfUyAipYbRUXc";
