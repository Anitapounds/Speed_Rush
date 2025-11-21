module speed_rush::racing_car_nft {
    use std::string::{Self, String};
    use one::display;
    use one::object::{Self, UID, ID};
    use one::package;
    use one::transfer;
    use one::tx_context::{Self, TxContext};
    use one::url::{Self, Url};
    use one::event;

    
    public struct RacingCar has key, store {
        id: UID,
        name: String,
        description: String,
        image_url: Url,
        rarity: u8, 
        model: String,
        color: String,
        top_speed: u64,
        acceleration: u64,
        handling: u64,
        minted_at: u64,
    }

    
    public struct RACING_CAR_NFT has drop {}

    
    public struct MintingConfig has key {
        id: UID,
        admin: address,
        mint_price: u64,
        total_minted: u64,
        max_supply: u64,
        minting_enabled: bool,
    }

    
    public struct CarMinted has copy, drop {
        car_id: ID,
        owner: address,
        rarity: u8,
        model: String,
    }

    public struct CarBurned has copy, drop {
        car_id:  ID,
        owner: address,
    }

    
    fun init(otw: RACING_CAR_NFT, ctx: &mut TxContext) {
        let keys = vector[
            string::utf8(b"name"),
            string::utf8(b"description"),
            string::utf8(b"image_url"),
            string::utf8(b"rarity"),
            string::utf8(b"model"),
            string::utf8(b"color"),
            string::utf8(b"top_speed"),
            string::utf8(b"acceleration"),
            string::utf8(b"handling"),
        ];

        let values = vector[
            string::utf8(b"{name}"),
            string::utf8(b"{description}"),
            string::utf8(b"{image_url}"),
            string::utf8(b"{rarity}"),
            string::utf8(b"{model}"),
            string::utf8(b"{color}"),
            string::utf8(b"{top_speed}"),
            string::utf8(b"{acceleration}"),
            string::utf8(b"{handling}"),
        ];

        let publisher = package::claim(otw, ctx);
        let mut display = display::new_with_fields<RacingCar>(
            &publisher, keys, values, ctx
        );

        display::update_version(&mut display);
        transfer::public_transfer(publisher, tx_context::sender(ctx));
        transfer::public_transfer(display, tx_context::sender(ctx));

        
        let config = MintingConfig {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            mint_price: 1_000_000_000, 
            total_minted: 0,
            max_supply: 10000,
            minting_enabled: true,
        };

        transfer::share_object(config);
    }

    
    public entry fun mint_car(
        config: &mut MintingConfig,
        name: vector<u8>,
        model: vector<u8>,
        color: vector<u8>,
        rarity: u8,
        ctx: &mut TxContext
    ) {
        assert!(config.minting_enabled, 0); 
        assert!(config.total_minted < config.max_supply, 1); 
        assert!(rarity <= 3, 2); 

        let sender = tx_context::sender(ctx);

        
        let (top_speed, acceleration, handling) = calculate_stats(rarity);

        let description = if (rarity == 0) {
            string::utf8(b"A common racing car with standard performance")
        } else if (rarity == 1) {
            string::utf8(b"A rare racing car with enhanced capabilities")
        } else if (rarity == 2) {
            string::utf8(b"An epic racing car with superior performance")
        } else {
            string::utf8(b"A legendary racing car with unmatched power")
        };

        let car = RacingCar {
            id: object::new(ctx),
            name: string::utf8(name),
            description,
            image_url: url::new_unsafe_from_bytes(b"https://speedrush.game/cars/default.png"),
            rarity,
            model: string::utf8(model),
            color: string::utf8(color),
            top_speed,
            acceleration,
            handling,
            minted_at: tx_context::epoch(ctx),
        };

        let car_id = object::id(&car);
        config.total_minted = config.total_minted + 1;

        event::emit(CarMinted {
            car_id,
            owner: sender,
            rarity,
            model: string::utf8(model),
        });

        transfer::public_transfer(car, sender);
    }

    
    public entry fun mint_free_car(
        config: &mut MintingConfig,
        recipient: address,
        ctx: &mut TxContext
    ) {
        assert!(config.total_minted < config.max_supply, 1);

        let car = RacingCar {
            id: object::new(ctx),
            name: string::utf8(b"Starter Car"),
            description: string::utf8(b"Your first racing car - welcome to Speed Rush!"),
            image_url: url::new_unsafe_from_bytes(b"https://speedrush.game/cars/starter.png"),
            rarity: 0, 
            model: string::utf8(b"SR-001"),
            color: string::utf8(b"Blue"),
            top_speed: 50,
            acceleration: 50,
            handling: 50,
            minted_at: tx_context::epoch(ctx),
        };

        let car_id = object::id(&car);
        config.total_minted = config.total_minted + 1;

        event::emit(CarMinted {
            car_id,
            owner: recipient,
            rarity: 0,
            model: string::utf8(b"SR-001"),
        });

        transfer::public_transfer(car, recipient);
    }

    
    public entry fun burn_car(
        car: RacingCar,
        ctx: &TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let car_id = object::id(&car);

        event::emit(CarBurned {
            car_id,
            owner: sender,
        });

        let RacingCar {
            id,
            name: _,
            description: _,
            image_url: _,
            rarity: _,
            model: _,
            color: _,
            top_speed: _,
            acceleration: _,
            handling: _,
            minted_at: _,
        } = car;
        object::delete(id);
    }

    
    public entry fun update_config(
        config: &mut MintingConfig,
        new_price: u64,
        new_max_supply: u64,
        enabled: bool,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == config.admin, 3);
        config.mint_price = new_price;
        config.max_supply = new_max_supply;
        config.minting_enabled = enabled;
    }

    
    fun calculate_stats(rarity: u8): (u64, u64, u64) {
        if (rarity == 0) {
            (50, 50, 50) 
        } else if (rarity == 1) {
            (70, 70, 70) 
        } else if (rarity == 2) {
            (85, 85, 85) 
        } else {
            (100, 100, 100) 
        }
    }

    
    public fun get_rarity(car: &RacingCar): u8 {
        car.rarity
    }

    public fun get_stats(car: &RacingCar): (u64, u64, u64) {
        (car.top_speed, car.acceleration, car.handling)
    }

    public fun get_model(car: &RacingCar): String {
        car.model
    }

    public fun get_total_minted(config: &MintingConfig): u64 {
        config.total_minted
    }
}