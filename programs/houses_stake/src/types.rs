use anchor_lang::prelude::*;

#[account]
pub struct StakePda {
    pub bump: u8,
    pub last_reward: u8,
}
#[account]
pub struct Data {
    pub stacked: u64, // 8
    pub is_stacking_freezed: bool, // 1
    pub bump: u8, // 1
    pub current_reward: u8, // 1
    pub rewards_history: Vec<u64>, // 4 + 256 * 8
    pub stacked_history: Vec<u64> // 4 + 256 * 8
}

pub const TOKEN_KEEPER_ADDRESS: &str = "2bgCfBD4DQKQHNrtRhHMTYisiGyRchvHZGH96iqb7F9x";
pub const TOKEN_MINT_ADDRESS: &str = "5N9c9iruazRNSNsZG2SW8q9xVfSHAepgmQgSRiKuN6oy";
pub const REWARD_MINT_ADDRESS: &str = "HvZLpykkz6uHC2eVfwAc5QLzaAwfusY4yhYSabCaMWnA";
pub const AUTHORITY_ADDRESS: &str = "Fzt2kevkARG4LCKaCj1jVXe5oL4nvscBRNx7Y34VhGv2";
