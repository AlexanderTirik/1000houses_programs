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
pub const TOKEN_MINT_ADDRESS: &str = "C5cvu4AraQ1svw9gZGTfkjLxfvTUFTajHGHXFBM2b8mJ";
pub const AUTHORITY_ADDRESS: &str = "8gSejFHC9NdrmoLQnhrf2oqHPEcdNnTDmy1ozqzrrEc1";
