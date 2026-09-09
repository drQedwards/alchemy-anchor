#![no_std]
//! alchemy_anchor — hop recorder for USDC/BTC/SOL/XLM/ETH.
//! Root is live pmll_anchor CCF3. Route panics unless:
//!   1. MoonPay UUID hash is confirmed
//!   2. pmll_anchor.get(id) already matches the commitment
//! Does not mint. Token movement stays off this contract.

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, vec, Address, BytesN, Env, Symbol,
};

pub const DEFAULT_ROOT: &str = "CCF3B64AXLS4OLY5RN4H4K2CFZAYNZCJQY5MKCKCVAKMZNH7G7F7XUUF";

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Root,
    MoonPay(BytesN<32>),
    Hop(BytesN<32>),
}

#[contract]
pub struct AlchemyAnchor;

#[contractimpl]
impl AlchemyAnchor {
    pub fn init(env: Env, admin: Address, root: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Root, &root);
    }

    pub fn root(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Root).unwrap()
    }

    /// HITL: record a completed MoonPay transaction UUID hash (32 bytes).
    pub fn confirm_moonpay(env: Env, uuid_hash: BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage()
            .persistent()
            .set(&DataKey::MoonPay(uuid_hash.clone()), &true);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::MoonPay(uuid_hash.clone()), 1_000, 30 * 17_280);
        env.events()
            .publish((symbol_short!("alch"), symbol_short!("uuid")), uuid_hash);
    }

    pub fn moonpay_ok(env: Env, uuid_hash: BytesN<32>) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::MoonPay(uuid_hash))
            .unwrap_or(false)
    }

    /// Record an interchainer hop. Requires MoonPay UUID + root store match.
    /// asset is a short symbol: USDC / BTC / SOL / XLM / ETH. Never mints.
    pub fn route(
        env: Env,
        id: BytesN<32>,
        commitment: BytesN<32>,
        uuid_hash: BytesN<32>,
        asset: Symbol,
    ) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        let ok: bool = env
            .storage()
            .persistent()
            .get(&DataKey::MoonPay(uuid_hash.clone()))
            .unwrap_or(false);
        if !ok {
            panic!("await moonpay uuid");
        }
        let root: Address = env.storage().instance().get(&DataKey::Root).unwrap();
        let stored: Option<BytesN<32>> =
            env.invoke_contract(&root, &Symbol::new(&env, "get"), vec![&env, id.to_val()]);
        match stored {
            Some(c) if c == commitment => {}
            _ => panic!("await root store"),
        }
        env.storage()
            .persistent()
            .set(&DataKey::Hop(id.clone()), &(commitment.clone(), asset.clone()));
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Hop(id.clone()), 1_000, 30 * 17_280);
        env.events().publish(
            (symbol_short!("alch"), symbol_short!("hop")),
            (id, commitment, uuid_hash, asset),
        );
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, BytesN, Env, Symbol};

    #[test]
    fn confirm_then_moonpay_ok() {
        let env = Env::default();
        env.mock_all_auths();
        let cid = env.register(AlchemyAnchor, ());
        let client = AlchemyAnchorClient::new(&env, &cid);
        let admin = Address::generate(&env);
        let root = Address::generate(&env);
        client.init(&admin, &root);
        let uuid = BytesN::from_array(&env, &[9u8; 32]);
        assert_eq!(client.moonpay_ok(&uuid), false);
        client.confirm_moonpay(&uuid);
        assert_eq!(client.moonpay_ok(&uuid), true);
    }

    #[test]
    #[should_panic(expected = "await moonpay uuid")]
    fn route_without_uuid_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let cid = env.register(AlchemyAnchor, ());
        let client = AlchemyAnchorClient::new(&env, &cid);
        let admin = Address::generate(&env);
        let root = Address::generate(&env);
        client.init(&admin, &root);
        let id = BytesN::from_array(&env, &[1u8; 32]);
        let c = BytesN::from_array(&env, &[2u8; 32]);
        let uuid = BytesN::from_array(&env, &[3u8; 32]);
        client.route(&id, &c, &uuid, &Symbol::new(&env, "USDC"));
    }
}
