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
    pub is_stacking_freezed: bool, // 1
    pub bump: u8, // 1
    pub current_reward_index: u8, // 1
    pub current_reward: u64, // 8
}

pub const TOKEN_KEEPER_ADDRESS: &str = "2bgCfBD4DQKQHNrtRhHMTYisiGyRchvHZGH96iqb7F9x";
pub const TOKEN_MINT_ADDRESS: &str = "FDr93t7u2fxXEfLFpanFhEqLrT4C62KnHtcjtxbj66zZ";
pub const REWARD_MINT_ADDRESS: &str = "9aqeodqQdmwZJJwZvfBtkHCdXddi6BFMRHMisrg5PYZW";
pub const AUTHORITY_ADDRESS: &str = "Fzt2kevkARG4LCKaCj1jVXe5oL4nvscBRNx7Y34VhGv2";
