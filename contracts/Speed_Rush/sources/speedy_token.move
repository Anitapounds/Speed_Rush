module speed_rush::speedy_token {
    use std::option;
    use one::coin::{Self, Coin, TreasuryCap};
    use one::transfer;
    use one::tx_context::{Self, TxContext};
    use one::url;
    use one::object::{Self, UID};

    
    public struct SPEEDY_TOKEN has drop {}

    
    public struct GameTreasury has key {
        id: UID,
        treasury_cap: TreasuryCap<SPEEDY_TOKEN>,
        admin: address,
    }

    
    fun init(witness: SPEEDY_TOKEN, ctx: &mut TxContext) {
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            9, 
            b"SPEEDY",
            b"Speed Rush Token",
            b"The native token of Speed Rush racing game. Earn SPEEDY by racing and staking NFT cars!",
            option::some(url::new_unsafe_from_bytes(b"https://speedrush.game/logo.png")),
            ctx
        );

        
        transfer::public_freeze_object(metadata);

        
        let game_treasury = GameTreasury {
            id: object::new(ctx),
            treasury_cap,
            admin: tx_context::sender(ctx),
        };

        transfer::share_object(game_treasury);
    }

    
    public(package) fun mint(
        treasury: &mut GameTreasury,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<SPEEDY_TOKEN> {
        coin::mint(&mut treasury.treasury_cap, amount, ctx)
    }

    
    public entry fun award_race_tokens(
        treasury: &mut GameTreasury,
        recipient: address,
        distance: u64,
        obstacles_avoided: u64,
        bonus_boxes: u64,
        ctx: &mut TxContext
    ) {
        
        let distance_reward = (distance / 100) * 500_000_000; 
        let obstacle_reward = obstacles_avoided * 200_000_000; 
        let bonus_reward = bonus_boxes * 500_000_000; 
        let completion_bonus = 100_000_000_000; 

        let total_reward = distance_reward + obstacle_reward + bonus_reward + completion_bonus;

        let coins = coin::mint(&mut treasury.treasury_cap, total_reward, ctx);
        transfer::public_transfer(coins, recipient);
    }

    
    public entry fun award_welcome_bonus(
        treasury: &mut GameTreasury,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let welcome_bonus = 100_000_000_000; 
        let coins = coin::mint(&mut treasury.treasury_cap, welcome_bonus, ctx);
        transfer::public_transfer(coins, recipient);
    }

    
    public entry fun burn_tokens(
        treasury: &mut GameTreasury,
        coins: Coin<SPEEDY_TOKEN>
    ) {
        coin::burn(&mut treasury.treasury_cap, coins);
    }

    
    public entry fun update_admin(
        treasury: &mut GameTreasury,
        new_admin: address,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == treasury.admin, 0);
        treasury.admin = new_admin;
    }

    
    public fun total_supply(treasury: &GameTreasury): u64 {
        coin::total_supply(&treasury.treasury_cap)
    }
}