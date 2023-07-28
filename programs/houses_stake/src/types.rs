use anchor_lang::prelude::*;

#[account]
pub struct StakePda {
    pub bump: u8,
    pub last_reward_index: u8,
    pub stacked: u64
}
#[account]
pub struct Data {
    pub stacked: u64, // 8
    pub previous_stacked: u64, // 8
    pub is_stacking_freezed: bool, // 1
    pub bump: u8, // 1
    pub reward: u64, // 8
    pub reward_index: u8 // 1 
}

pub const TOKEN_MINT_ADDRESS: &str = "7Z7FPs9tM3k9zVyWuKCfJ8g4D54qaKTdx942hkxc7qii";
pub const REWARD_MINT_ADDRESS: &str = "DKgvB5LHdG7DUreqER5vNzySDwZfqzMamxe2KBTNqZgq";
pub const AUTHORITY_ADDRESS: &str = "Fzt2kevkARG4LCKaCj1jVXe5oL4nvscBRNx7Y34VhGv2";
