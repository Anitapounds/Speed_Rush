module speed_rush::car_staking {
    use one::object::{Self, UID, ID};
    use one::transfer;
    use one::tx_context::{Self, TxContext};
    use one::clock::{Self, Clock};
    use one::table::{Self, Table};
    use one::event;
    use speed_rush::racing_car_nft::{Self as racing_car_nft, RacingCar};
    use speed_rush::speedy_token::{Self as speedy_token, GameTreasury};

    
    public struct StakingPool has key {
        id: UID,
        admin: address,
        
        staked_cars: Table<ID, StakeInfo>,
        
        reward_rate_common: u64,     
        reward_rate_rare: u64,       
        reward_rate_epic: u64,       
        reward_rate_legendary: u64,  
        total_staked: u64,
    }

    
    public struct StakeInfo has store, drop {
        car_id: ID,
        owner: address,
        rarity: u8,
        staked_at: u64, 
        last_claim: u64, 
    }

    
    public struct StakedCar has key, store {
        id: UID,
        car: RacingCar,
    }

    
    public struct CarStaked has copy, drop {
        car_id: ID,
        owner: address,
        rarity: u8,
        timestamp: u64,
    }

    public struct CarUnstaked has copy, drop {
        car_id: ID,
        owner: address,
        rewards_claimed: u64,
        timestamp: u64,
    }

    public struct RewardsClaimed has copy, drop {
        car_id: ID,
        owner: address,
        amount: u64,
        timestamp: u64,
    }

    
    fun init(ctx: &mut TxContext) {
        let pool = StakingPool {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            staked_cars: table::new(ctx),
            reward_rate_common: 1_000_000_000,     
            reward_rate_rare: 3_000_000_000,       
            reward_rate_epic: 10_000_000_000,      
            reward_rate_legendary: 25_000_000_000, 
            total_staked: 0,
        };

        transfer::share_object(pool);
    }

    
    public entry fun stake_car(
        pool: &mut StakingPool,
        car: RacingCar,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let car_id = object::id(&car);
        let rarity = racing_car_nft::get_rarity(&car);
        let current_time = clock::timestamp_ms(clock);

        
        let stake_info = StakeInfo {
            car_id,
            owner: sender,
            rarity,
            staked_at: current_time,
            last_claim: current_time,
        };

        
        table::add(&mut pool.staked_cars, car_id, stake_info);
        pool.total_staked = pool.total_staked + 1;

        
        let staked_car = StakedCar {
            id: object::new(ctx),
            car,
        };

        event::emit(CarStaked {
            car_id,
            owner: sender,
            rarity,
            timestamp: current_time,
        });

        
        transfer::transfer(staked_car, sender);
    }

    
    public fun calculate_rewards(
        pool: &StakingPool,
        car_id: ID,
        clock: &Clock
    ): u64 {
        if (!table::contains(&pool.staked_cars, car_id)) {
            return 0
        };

        let stake_info = table::borrow(&pool.staked_cars, car_id);
        let current_time = clock::timestamp_ms(clock);
        let time_elapsed = current_time - stake_info.last_claim;

        
        let hours_elapsed = time_elapsed / 3_600_000;

        
        let hourly_rate = if (stake_info.rarity == 0) {
            pool.reward_rate_common
        } else if (stake_info.rarity == 1) {
            pool.reward_rate_rare
        } else if (stake_info.rarity == 2) {
            pool.reward_rate_epic
        } else {
            pool.reward_rate_legendary
        };

        hours_elapsed * hourly_rate
    }

    
    public entry fun claim_rewards(
        pool: &mut StakingPool,
        treasury: &mut GameTreasury,
        car_id: ID,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        assert!(table::contains(&pool.staked_cars, car_id), 0);

        
        let current_time = clock::timestamp_ms(clock);
        let rewards = calculate_rewards(pool, car_id, clock);

        
        let stake_info = table::borrow_mut(&mut pool.staked_cars, car_id);
        assert!(stake_info.owner == sender, 1);

        
        stake_info.last_claim = current_time;

        if (rewards > 0) {
            
            let reward_coins = speedy_token::mint(treasury, rewards, ctx);
            transfer::public_transfer(reward_coins, sender);

            event::emit(RewardsClaimed {
                car_id,
                owner: sender,
                amount: rewards,
                timestamp: current_time,
            });
        }
    }

    
    public entry fun unstake_car(
        pool: &mut StakingPool,
        treasury: &mut GameTreasury,
        staked_car: StakedCar,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        let StakedCar { id: staked_id, car } = staked_car;
        let car_id = object::id(&car);

        assert!(table::contains(&pool.staked_cars, car_id), 0);
        let stake_info = table::borrow(&pool.staked_cars, car_id);
        assert!(stake_info.owner == sender, 1);

        
        let rewards = calculate_rewards(pool, car_id, clock);
        let current_time = clock::timestamp_ms(clock);

        if (rewards > 0) {
            let reward_coins = speedy_token::mint(treasury, rewards, ctx);
            transfer::public_transfer(reward_coins, sender);
        };

        
        table::remove(&mut pool.staked_cars, car_id);
        pool.total_staked = pool.total_staked - 1;

        event::emit(CarUnstaked {
            car_id,
            owner: sender,
            rewards_claimed: rewards,
            timestamp: current_time,
        });

        
        transfer::public_transfer(car, sender);
        object::delete(staked_id);
    }

    
    public entry fun update_reward_rates(
        pool: &mut StakingPool,
        common: u64,
        rare: u64,
        epic: u64,
        legendary: u64,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == pool.admin, 2);
        pool.reward_rate_common = common;
        pool.reward_rate_rare = rare;
        pool.reward_rate_epic = epic;
        pool.reward_rate_legendary = legendary;
    }

    
    public fun get_total_staked(pool: &StakingPool): u64 {
        pool.total_staked
    }

    public fun is_car_staked(pool: &StakingPool, car_id: ID): bool {
        table::contains(&pool.staked_cars, car_id)
    }

    public fun get_stake_info(pool: &StakingPool, car_id: ID): (address, u8, u64, u64) {
        let info = table::borrow(&pool.staked_cars, car_id);
        (info.owner, info.rarity, info.staked_at, info.last_claim)
    }
}