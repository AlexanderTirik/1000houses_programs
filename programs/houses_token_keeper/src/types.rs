use anchor_lang::prelude::*;

#[account]
pub struct UserPda {
    pub bump: u8
}

pub const TOKEN_MINT_ADDRESS: &str = "74UJb8m7Q6g2tiVHv9yNDSH485Q98SAocbHusAHarE1F";
pub const AUTHORITY_ADDRESS: &str = "Fzt2kevkARG4LCKaCj1jVXe5oL4nvscBRNx7Y34VhGv2";
pub const STAKE_PROGRAM_ADDRESS: &str = "GBcstHFNnGBqBpiZfurPDZJoousWxYZBfUyAipYbRUXc";
