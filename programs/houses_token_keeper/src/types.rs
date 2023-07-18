use anchor_lang::prelude::*;

#[account]
pub struct UserPda {
    pub bump: u8
}

pub const TOKEN_MINT_ADDRESS: &str = "5N9c9iruazRNSNsZG2SW8q9xVfSHAepgmQgSRiKuN6oy";
pub const AUTHORITY_ADDRESS: &str = "Fzt2kevkARG4LCKaCj1jVXe5oL4nvscBRNx7Y34VhGv2";
pub const STAKE_PROGRAM_ADDRESS: &str = "GBcstHFNnGBqBpiZfurPDZJoousWxYZBfUyAipYbRUXc";
