use anchor_lang::prelude::*;

#[account]
pub struct StakePda {
    pub bump: u8
}
#[account]
pub struct Data {
    pub stacked: u64,
    pub is_stacking_freezed: bool,
    pub bump: u8
}

pub const TOKEN_KEEPER_ADDRESS: &str = "2bgCfBD4DQKQHNrtRhHMTYisiGyRchvHZGH96iqb7F9x";
pub const TOKEN_MINT_ADDRESS: &str = "7Z7FPs9tM3k9zVyWuKCfJ8g4D54qaKTdx942hkxc7qii";
pub const AUTHORITY_ADDRESS: &str = "Fzt2kevkARG4LCKaCj1jVXe5oL4nvscBRNx7Y34VhGv2";
