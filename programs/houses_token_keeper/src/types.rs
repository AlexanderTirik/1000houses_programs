use anchor_lang::prelude::*;

#[account]
pub struct UserPda {
    pub bump: u8
}

pub const TOKEN_MINT_ADDRESS: &str = "7Z7FPs9tM3k9zVyWuKCfJ8g4D54qaKTdx942hkxc7qii";
pub const REWARD_MINT_ADDRESS: &str = "DKgvB5LHdG7DUreqER5vNzySDwZfqzMamxe2KBTNqZgq";
pub const AUTHORITY_ADDRESS: &str = "Fzt2kevkARG4LCKaCj1jVXe5oL4nvscBRNx7Y34VhGv2";
pub const STAKE_PROGRAM_ADDRESS: &str = "Ezy2MxpDoPvaRB7fPq32vgFXiZHcKsX3TEd7d7WFPFm7";
