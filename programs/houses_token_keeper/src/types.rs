use anchor_lang::prelude::*;

#[account]
pub struct UserPda {
    pub bump: u8
}

pub const TOKEN_MINT_ADDRESS: &str = "FDr93t7u2fxXEfLFpanFhEqLrT4C62KnHtcjtxbj66zZ";
pub const REWARD_MINT_ADDRESS: &str = "9aqeodqQdmwZJJwZvfBtkHCdXddi6BFMRHMisrg5PYZW";
pub const AUTHORITY_ADDRESS: &str = "Fzt2kevkARG4LCKaCj1jVXe5oL4nvscBRNx7Y34VhGv2";
pub const STAKE_PROGRAM_ADDRESS: &str = "GBcstHFNnGBqBpiZfurPDZJoousWxYZBfUyAipYbRUXc";
