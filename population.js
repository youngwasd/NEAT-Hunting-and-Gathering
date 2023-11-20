class PopulationManager {
    static PREY_SPECIES_ID = 0;
    static PREDATOR_SPECIES_ID = 0;
    static GEN_NUM = 0;
    static SPECIES_CREATED = 0;
    static WORLD_CREATED = 0;
    static SPECIES_COLORS = new Map();
    static SPECIES_SENSOR_COLORS = new Map();
    static PREY_SPECIES_MEMBERS = new Map(); // Old behavior uses prey as the single population
    static PREDATOR_SPECIES_MEMBERS = new Map();
    static COLORS_USED = new Set();
    static SENSOR_COLORS_USED = new Set();
    static NUM_PREY = params.num_prey;
    static NUM_PREDATOR = params.num_prey / params.predator_ratio;
    static CURRENT_GEN_DATA_GATHERING_SLOT = 0;
    static WORLD_COLOR_POOL = [];
    static MINIMAP;
    static CURRENT_WORLD_DISPLAY = 0;
    static IS_LAST_TICK = false; //Use for debugging purposes; to determine whether the current population is at its last tick

    //TODO: for old behavior add pred+prey counts together, have splitting behavior check the ratio for accurate role swapping
    constructor(game) {
        this.game = game;
        this.foodTracker = new FoodTracker();
        this.agentTracker = new AgentTracker();
        this.tickCounter = 0;
        this.genomeTracker = new GenomeTracker();
        let defaultColor = randomInt(361);
        PopulationManager.COLORS_USED.add(defaultColor);
        PopulationManager.SPECIES_COLORS.set(0, defaultColor);
        let defaultSensorColor = AgentInputUtil.randomBlueHue();
        PopulationManager.SENSOR_COLORS_USED.add(defaultSensorColor);
        PopulationManager.SPECIES_SENSOR_COLORS.set(0, defaultSensorColor);

        this.worlds = new Map();
        this.createFoodPodLayout();

        this.preySpeciesWorldList = new Map(); // List of worlds for species

        if (params.coevolution) {
            console.log("coevolution enabled, pred species map created")
            this.predatorSpeciesWorldList = new Map();
        }
        this.resetWorldColorPool();

        // Original behavior with a single population
        if (!params.coevolution) {
            //Check for splitting agents
            if (params.AGENT_PER_WORLD === 0) {
                let world = this.initNewWorld(PopulationManager.PREY_SPECIES_ID);
                world.preySpeciesList.add(0);
                this.spawnAgents(PopulationManager.PREY_SPECIES_ID);
                this.preySpeciesWorldList.set(PopulationManager.PREY_SPECIES_ID, [0]);
                this.spawnFood(PopulationManager.PREY_SPECIES_ID, false);
                this.spawnFood(PopulationManager.PREY_SPECIES_ID, true);
    
                this.resetCanvases();
            } else {
                //Split the original specie into multiple worlds
                PopulationManager.PREY_SPECIES_MEMBERS.set(PopulationManager.PREY_SPECIES_ID, []);
                PopulationManager.SPECIES_CREATED++;
                this.preySpeciesWorldList.set(PopulationManager.PREY_SPECIES_ID, []);
                let numberOfAgentToSpawned = PopulationManager.NUM_PREY;
                let worldSpawned = 0;
    
                //Distribute the agents to the world
                while (numberOfAgentToSpawned > 0) {
                    let agentNum = Math.min(numberOfAgentToSpawned, params.predator_ratio + 1);
                    let world = this.initNewWorld(worldSpawned);
    
                    //Add to the list of species the world contains
                    world.preySpeciesList.add(0); //The first species
    
                    this.spawnAgents(worldSpawned, agentNum);
                    this.preySpeciesWorldList.get(PopulationManager.PREY_SPECIES_ID).push(worldSpawned);
    
                    this.spawnFood(worldSpawned, false);
                    this.spawnFood(worldSpawned, true);
    
                    //console.log(world.agents);
                    numberOfAgentToSpawned -= agentNum;
                    worldSpawned++;
                }
                PopulationManager.WORLD_CREATED = worldSpawned;
                this.resetCanvases();
            }
        } else { // coevolution behavior with predator and prey in their own unique populations
            //Check for splitting agents
            if (params.AGENT_PER_WORLD === 0) {
                let world = this.initNewWorld(PopulationManager.PREY_SPECIES_ID);
                world.preySpeciesList.add(0);
                this.spawnAgents(PopulationManager.PREY_SPECIES_ID);
                this.preySpeciesWorldList.set(PopulationManager.PREY_SPECIES_ID, [0]);
                this.spawnFood(PopulationManager.PREY_SPECIES_ID, false);
                this.spawnFood(PopulationManager.PREY_SPECIES_ID, true);
    
                this.resetCanvases();
            } else {
                //Split the original specie into multiple worlds
                PopulationManager.PREY_SPECIES_MEMBERS.set(PopulationManager.PREY_SPECIES_ID, []);
                PopulationManager.PREDATOR_SPECIES_MEMBERS.set(PopulationManager.PREDATOR_SPECIES_ID, []);
                PopulationManager.SPECIES_CREATED++;
                this.preySpeciesWorldList.set(PopulationManager.PREY_SPECIES_ID, []);
                this.predatorSpeciesWorldList.set(PopulationManager.PREDATOR_SPECIES_ID, []);
                let numberOfAgentToSpawn = PopulationManager.NUM_PREY;
                console.log(PopulationManager.NUM_PREY + "prey to spawn is this")
                let worldSpawned = 0;
    
                //Distribute the agents to the world
                while (numberOfAgentToSpawn > 0) {
                    let world = this.initNewWorld(worldSpawned);
                    let agentNum = params.predator_ratio;
    
                    //Add to the list of species the world contains
                    world.preySpeciesList.add(0); // The first prey species
                    world.predatorSpeciesList.add(0) // The first predator species
    
                    this.spawnAgents(worldSpawned, agentNum);
                    this.preySpeciesWorldList.get(PopulationManager.PREY_SPECIES_ID).push(worldSpawned);
                    this.predatorSpeciesWorldList.get(PopulationManager.PREDATOR_SPECIES_ID).push(worldSpawned);
    
                    this.spawnFood(worldSpawned, false);
                    this.spawnFood(worldSpawned, true);
    
                    //console.log(world.agents);
                    numberOfAgentToSpawn -= agentNum;
                    worldSpawned++;
                }
                PopulationManager.WORLD_CREATED = worldSpawned;
                this.resetCanvases();
            }
        }


        this.updateWorldsFoodHierarchy();
    
        this.currentLeftWheelHist = new Histogram(20, 5, "Current Generation Left Wheel Output Chart");
        this.currentLeftWheelHist.data.push(new Array(20).fill(0));

        this.currentRightWheelHist = new Histogram(20, 5, "Current Generation Right Wheel Output Chart");
        this.currentRightWheelHist.data.push(new Array(20).fill(0));

        //Create generational histograms
        this.leftWheelHist = new Histogram(20, 5, "Average Left Wheel Output Per Generation");

        this.rightWheelHist = new Histogram(20, 5, "Average Right Wheel Output Per Generation");

        if (params.AGENT_BITING) {
            this.currentBiteHist = new Histogram(20, 5, "Current Generation Biting Output Chart");
            this.currentBiteHist.data.push(new Array(20).fill(0));
            //Generational
            this.biteHist = new Histogram(20, 5, "Average Bite Output Per Generation");
        }

        this.preyConsumedData = {
            chart: new Linechart(20, 50, 700, 400, [], "Prey Consumed Per Generations Chart", "Generations", "Times consumed"),
            currentGenData: 0,
        }

        this.preyCaloriesEatenData = {
            chart: new Linechart(20, 50, 700, 400, [], "Calories Eaten By Prey Per Generations Chart", "Generations", "Times consumed"),
            currentGenData: 0,
        }

        this.rolesMirrored = false;

        PopulationManager.MINIMAP = new Minimap(game);
        //Update the spec for minimap
        PopulationManager.MINIMAP.updateSpec(this.worlds.size);

        // this.worlds.forEach((world) => {
        //     console.log(world);
        // } );

    };

    //Return NULL if no color is availble
    static getNextAvailableWorldColor() {
        if (PopulationManager.WORLD_COLOR_POOL.length <= 0)
            return null;
        let res = PopulationManager.WORLD_COLOR_POOL.shift();
        //PopulationManager.WORLD_COLOR_POOL.remove(res);
        return res;
    }

    resetWorldColorPool() {
        PopulationManager.WORLD_COLOR_POOL = [];

        for (let i = 0; i <= 360; i++) {
            PopulationManager.WORLD_COLOR_POOL.push(i);
        }

        PopulationManager.WORLD_COLOR_POOL = shuffleArray(PopulationManager.WORLD_COLOR_POOL);
    }


    createFoodPodLayout() { // all worlds will share the same food / poison pod layout. this will ensure clean merging and splitting
        let foodPods = [];
        let poisonPods = [];
        let flag = false;
        for (let theta = 0; theta < 2 * Math.PI; theta += Math.PI / 4) {
            let randomDist = params.CANVAS_SIZE / 2.5;
            let centerX = params.CANVAS_SIZE / 2 + randomDist * Math.cos(theta);
            let centerY = params.CANVAS_SIZE / 2 + randomDist * Math.sin(theta);
            let currList = flag ? poisonPods : foodPods;
            currList.push(new FoodPod(this.game, centerX, centerY, params.CANVAS_SIZE / 5, flag));
            flag = !flag;
        }
        this.foodPodLayout = foodPods;
        this.poisonPodLayout = poisonPods;
    };


    //Replenish the food and poison relative to the Food Pod
    redistributeFoodAndPoison() {
        let foodIndex = 0;
        let poisonIndex = 0;
        this.worlds.forEach(members => {
            members.food.forEach(f => {
                let pos = this.foodPodLayout[foodIndex].genFoodPos();
                f.x = pos.x;
                f.y = pos.y;
                f.updateBoundingCircle();
                foodIndex = (foodIndex + 1) % this.foodPodLayout.length;
            });
            members.poison.forEach(p => {
                let pos = this.poisonPodLayout[poisonIndex].genFoodPos();
                p.x = pos.x;
                p.y = pos.y;
                p.updateBoundingCircle();
                poisonIndex = (poisonIndex + 1) % this.poisonPodLayout.length;
            });
        });
    };

    resetSim() {
        console.log("restarting sim...");
        params.AGENT_VISION_IS_CONE = document.getElementById("agent_vision_is_cone").checked;
        params.PREY_BOTH_RAYS = document.getElementById("prey_both_rays").checked;
        params.PREDATOR_BOTH_RAYS = document.getElementById("predator_both_rays").checked;
        params.PREY_BINOCULAR_VISION = document.getElementById("prey_binocular_vision").checked;
        params.PREDATOR_BINOCULAR_VISION = document.getElementById("predator_binocular_vision").checked;
        params.PREY_LEFT_RAYS = parseInt(document.getElementById("prey_left_rays").value);
        params.PREY_RIGHT_RAYS = parseInt(document.getElementById("prey_right_rays").value);
        params.PREDATOR_LEFT_RAYS = parseInt(document.getElementById("predator_left_rays").value);
        params.PREDATOR_RIGHT_RAYS = parseInt(document.getElementById("predator_right_rays").value);
        params.PREY_VISION_RAYS = parseFloat(document.getElementById("prey_vision_rays").value);
        params.PREDATOR_VISION_RAYS = parseFloat(document.getElementById("predator_vision_rays").value);
        params.PREY_DISTANCE_SENSORS = document.getElementById("prey_distance_sensors").checked;
        params.PREDATOR_DISTANCE_SENSORS = document.getElementById("predator_distance_sensors").checked;
        PopulationManager.PREY_SPECIES_ID = 0;
        PopulationManager.PREDATOR_SPECIES_ID = 0;
        PopulationManager.GEN_NUM = 0;
        PopulationManager.SPECIES_CREATED = 0;
        PopulationManager.SPECIES_COLORS = new Map();
        PopulationManager.SPECIES_SENSOR_COLORS = new Map();
        PopulationManager.PREY_SPECIES_MEMBERS = new Map();
        PopulationManager.PREDATOR_SPECIES_MEMBERS = new Map();
        PopulationManager.COLORS_USED = new Set();
        PopulationManager.SENSOR_COLORS_USED = new Set();
        PopulationManager.NUM_PREY = params.num_prey;
        PopulationManager.NUM_PREDATOR = params.num_prey/params.predator_ratio;
        PopulationManager.CURRENT_GEN_DATA_GATHERING_SLOT = 0;

        //Reset generational histograms
        this.leftWheelHist = new Histogram(20, 5, "Average Left Wheel Output Per Generation");

        this.rightWheelHist = new Histogram(20, 5, "Average Right Wheel Output Per Generation");

        this.preyConsumedData.chart.reset();
        this.preyConsumedData.currentGenData = 0;

        if (params.AGENT_BITING) {
            //Generational
            this.biteHist = new Histogram(20, 5, "Average Bite Output Per Generation");
        }

        //Update generation time when resetting
        if (document.activeElement.id !== "generation_time") {
            params.GEN_TICKS = parseInt(document.getElementById("generation_time").value);
        }

        if (document.activeElement.id !== "no_border") {
            params.NO_BORDER = document.getElementById("no_border").checked;
        }

        if (document.activeElement.id !== "genome_default_k_val") {
            params.GENOME_DEFAULT_K_VAL = parseFloat(document.getElementById("genome_default_k_val").value);
        }



        //Update hunting mode
        params.HUNTING_MODE = document.getElementById("huntingMode").value;
        if (params.HUNTING_MODE === "deactivated") {
            //params.HUNTING_MODE = false;
            document.getElementById("prey_speed").disabled = true;
            document.getElementById("predator_speed").disabled = true;
            document.getElementById("inactive_prey_targetable").disabled = true;
            document.getElementById("push_fhi_to_ann").disabled = true;
        }
        else if (params.HUNTING_MODE === "hierarchy" || params.HUNTING_MODE === "hierarchy_spectrum") {

            params.SPLIT_SPECIES = false;
            document.getElementById("split_species").checked = false;

            document.getElementById("prey_speed").disabled = false;
            document.getElementById("predator_speed").disabled = false;
            params.PREY_MAX_SPEED = parseFloat(document.getElementById("prey_speed").value);
            params.PREDATOR_MAX_SPEED = parseFloat(document.getElementById("predator_speed").value);

            document.getElementById("inactive_prey_targetable").disabled = false;
            params.INACTIVE_PREY_TARGETABLE = document.getElementById("inactive_prey_targetable").checked;

            document.getElementById("push_fhi_to_ann").disabled = false;
            params.PUSH_FHI_TO_ANN = document.getElementById("push_fhi_to_ann").checked;
        }
        Genome.resetAll();
        this.game.population = new PopulationManager(this.game);
    };

    update() {
        //Update the params
        //params.FREE_RANGE = document.getElementById("free_range").checked;
        params.AGENT_NEIGHBORS = document.getElementById("agent_neighbors").checked;
        params.ENFORCE_MIN_FOOD = document.getElementById("enforce_min_food").checked;
        //params.ENFORCE_MIN_POISON = document.getElementById("enforce_min_poison").checked;
        //params.RAND_FOOD_PHASES = document.getElementById("rand_food_phases").checked;
        //params.RAND_FOOD_LIFETIME = document.getElementById("rand_food_lifetime").checked;
        params.RAND_DEFAULT_WEIGHTS = document.getElementById("rand_default_weights").checked;
        //params.DYNAMIC_AGENT_SIZING = document.getElementById("dynamic_agent_sizing").checked;
        params.AGENT_VISION_DRAW_CONE = document.getElementById("draw_agent_vision_cone").checked;
        params.NO_DECAYING_FOOD = document.getElementById("no_decaying").checked;
        params.INNER_WALL = document.getElementById("inner_wall").checked;
        params.AGENT_BITING = document.getElementById("agent_biting").checked;
        params.NO_BORDER = document.getElementById("no_border").checked;
        params.LARGE_ENERGY_THRESHOLD = document.getElementById("largeEnergyThresh").checked;
        params.MOVING_FOOD = document.getElementById("moving_food").checked;
        params.RANDOMIZE_FOOD_SPAWN_PATTERN = document.getElementById("randomizing_food_spawn_pattern").checked;
        params.PAUSE_DRAWING = document.getElementById("pauseDrawing").checked;
        params.GRADUAL_CONSUMPTION = document.getElementById("GRADUAL_CONSUMPTION").checked;
       
        params.MIRROR_ROLES = document.getElementById("mirror_roles").checked;
        params.DISPLAY_MINIMAP = document.getElementById("display_minimap").checked;
        params.BUSH_SIGHT_MODE = document.getElementById("bush_sight_mode");
        
        if (params.GRADUAL_CONSUMPTION){
            document.getElementById("GRADUAL_CONSUMPTION_RESPAWN").disabled = false;
          
            params.GRADUAL_CONSUMPTION_RESPAWN = document.getElementById("GRADUAL_CONSUMPTION_RESPAWN").checked;
        }
        else{
            document.getElementById("GRADUAL_CONSUMPTION_RESPAWN").disabled = true;
            document.getElementById("GRADUAL_CONSUMPTION_RESPAWN").checked = false;
            params.GRADUAL_CONSUMPTION_RESPAWN = false;
        }

        if (params.PAUSE_DRAWING) {
            //Update the generation count 
            document.getElementById("pauseDrawingLabel").innerHTML = "Drawing paused. Current Gen: " + PopulationManager.GEN_NUM + (params.SAVE_TO_DB?"; Current Trial: " + params.SIM_CURR_TRIAL:"");
        }
        else{
            document.getElementById("pauseDrawingLabel").innerHTML = "Pause Drawing (To speed up the simulation)";
        }

        //Loading Profile
        if (document.getElementById("runByProfileMode").checked) {
            document.getElementById("profileOption").disabled = false;
            document.getElementById("loadProfile").disabled = false;
        }
        else {
            document.getElementById("profileOption").disabled = true;
            document.getElementById("loadProfile").disabled = true;
        }

        if (params.NO_DECAYING_FOOD) {
            document.getElementById("caloriesPerFood").disabled = false;
            params.CALORIES_PER_FOOD = parseFloat(document.getElementById("caloriesPerFood").value);
        } else {
            document.getElementById("caloriesPerFood").disabled = true;
        }

        if (params.MOVING_FOOD) {
            document.getElementById("movingFoodPattern").disabled = false;
            document.getElementById("food_velocityX").disabled = false;
            document.getElementById("food_velocityY").disabled = false;
            params.MOVING_FOOD_PATTERN = document.getElementById("movingFoodPattern").value;
            params.FOOD_VELOCITY_X = parseFloat(document.getElementById("food_velocityX").value);
            params.FOOD_VELOCITY_Y = parseFloat(document.getElementById("food_velocityY").value);
        }
        else {
            document.getElementById("movingFoodPattern").disabled = true;
            document.getElementById("food_velocityX").disabled = true;
            document.getElementById("food_velocityY").disabled = true;
        }

        if (params.LARGE_ENERGY_THRESHOLD) {
            Agent.START_ENERGY = 1000000;
        }
        else {
            Agent.START_ENERGY = 100;
        }

        if (document.activeElement.id !== "agent_per_world") {
            params.AGENT_PER_WORLD = parseInt(document.getElementById("agent_per_world").value);
        }

        params.DISPLAY_SAME_WORLD = document.getElementById("displayOnTheSameWorld").checked;


        // if (params.AGENT_PER_WORLD === 0 && params.SPLIT_SPECIES && !document.getElementById("split_species").checked) {
        //     this.mergeWorlds();
        // } else if (params.AGENT_PER_WORLD === 0 && !params.SPLIT_SPECIES && document.getElementById("split_species").checked) {
        //     this.splitWorlds();
        // }
        params.SPLIT_SPECIES = document.getElementById("split_species").checked;

        if (document.activeElement.id !== "food_agent_ratio") {
            params.FOOD_AGENT_RATIO = parseInt(document.getElementById("food_agent_ratio").value);
        }

        
        params.PREY_BOTH_ANGLE = document.getElementById("prey_both_angle").checked;
        params.PREDATOR_BOTH_ANGLE = document.getElementById("predator_both_angle").checked;

        if (params.PREY_BINOCULAR_VISION) {
            document.getElementById("prey_eye_distance").disabled = false;
            document.getElementById("prey_both_rays").disabled = false;
            document.getElementById("prey_both_angle").disabled = false;
            document.getElementById("prey_left_rays").disabled = true;
            document.getElementById("prey_right_rays").disabled = true;
            document.getElementById("prey_left_angle").disabled = true;
            document.getElementById("prey_right_angle").disabled = true;

            if (document.activeElement.id !== "prey_eye_distance") {
                params.PREY_EYE_DISTANCE = parseInt(document.getElementById("prey_eye_distance").value);
            }

            if (params.PREY_BOTH_RAYS) {
                document.getElementById("prey_vision_rays").disabled = false;
                document.getElementById("prey_left_rays").disabled = true;
                document.getElementById("prey_right_rays").disabled = true;
            } else {
                document.getElementById("prey_vision_rays").disabled = true;
                document.getElementById("prey_left_rays").disabled = false;
                document.getElementById("prey_right_rays").disabled = false;
                
            }

            if (params.PREY_BOTH_ANGLE) {
                document.getElementById("prey_vision_angle").disabled = false;
                document.getElementById("prey_left_angle").disabled = true;
                document.getElementById("prey_right_angle").disabled = true;
            } else {
                document.getElementById("prey_vision_angle").disabled = true;
                document.getElementById("prey_left_angle").disabled = false;
                document.getElementById("prey_right_angle").disabled = false;
                if (document.activeElement.id !== "prey_left_angle") {
                    params.PREY_LEFT_ANGLE = parseInt(document.getElementById("prey_left_angle").value);
                }
                if (document.activeElement.id !== "prey_right_angle") {
                    params.PREY_RIGHT_ANGLE = parseInt(document.getElementById("prey_right_angle").value);
                }
            }
        } else {
            document.getElementById("prey_eye_distance").disabled = true;
            document.getElementById("prey_vision_rays").disabled = false;
            document.getElementById("prey_vision_angle").disabled = false;
            document.getElementById("prey_both_angle").disabled = true;
            document.getElementById("prey_both_rays").disabled = true;
            document.getElementById("prey_left_rays").disabled = true;
            document.getElementById("prey_right_rays").disabled = true;
            document.getElementById("prey_left_angle").disabled = true;
            document.getElementById("prey_right_angle").disabled = true;
        }

        if (params.PREDATOR_BINOCULAR_VISION) {
            document.getElementById("predator_eye_distance").disabled = false;
            document.getElementById("predator_both_rays").disabled = false;
            document.getElementById("predator_both_angle").disabled = false;
            document.getElementById("predator_left_rays").disabled = true;
            document.getElementById("predator_right_rays").disabled = true;
            document.getElementById("predator_left_angle").disabled = true;
            document.getElementById("predator_right_angle").disabled = true;

            if (document.activeElement.id !== "predator_eye_distance") {
                params.PREDATOR_EYE_DISTANCE = parseInt(document.getElementById("predator_eye_distance").value);
            }

            if (params.PREDATOR_BOTH_RAYS) {
                document.getElementById("predator_vision_rays").disabled = false;
                document.getElementById("predator_left_rays").disabled = true;
                document.getElementById("predator_right_rays").disabled = true;
            } else {
                document.getElementById("predator_vision_rays").disabled = true;
                document.getElementById("predator_left_rays").disabled = false;
                document.getElementById("predator_right_rays").disabled = false;
            }

            if (params.PREDATOR_BOTH_ANGLE) {
                document.getElementById("predator_vision_angle").disabled = false;
                document.getElementById("predator_left_angle").disabled = true;
                document.getElementById("predator_right_angle").disabled = true;
            } else {
                document.getElementById("predator_vision_angle").disabled = true;
                document.getElementById("predator_left_angle").disabled = false;
                document.getElementById("predator_right_angle").disabled = false;
                if (document.activeElement.id !== "predator_left_angle") {
                    params.PREDATOR_LEFT_ANGLE = parseInt(document.getElementById("predator_left_angle").value);
                }
                if (document.activeElement.id !== "predator_right_angle") {
                    params.PREDATOR_RIGHT_ANGLE = parseInt(document.getElementById("predator_right_angle").value);
                }
            }
        } else {
            document.getElementById("predator_eye_distance").disabled = true;
            document.getElementById("predator_vision_rays").disabled = false;
            document.getElementById("predator_vision_angle").disabled = false;
            document.getElementById("predator_both_rays").disabled = true;
            document.getElementById("predator_both_angle").disabled = true;
            document.getElementById("predator_left_rays").disabled = true;
            document.getElementById("predator_right_rays").disabled = true;
            document.getElementById("predator_left_angle").disabled = true;
            document.getElementById("predator_right_angle").disabled = true;
        }

        if (document.activeElement.id !== "prey_vision_radius") {
            params.PREY_VISION_RADIUS = parseFloat(document.getElementById("prey_vision_radius").value);
        }

        if (document.activeElement.id !== "predator_vision_radius") {
            params.PREDATOR_VISION_RADIUS = parseFloat(document.getElementById("predator_vision_radius").value);
        }

        if (document.activeElement.id !== "prey_vision_angle") {
            params.PREY_VISION_ANGLE = parseFloat(document.getElementById("prey_vision_angle").value);
        }

        if (document.activeElement.id !== "predator_vision_angle") {
            params.PREDATOR_VISION_ANGLE = parseFloat(document.getElementById("predator_vision_angle").value);
        }

        if (document.activeElement.id !== "compat_threshold") {
            params.COMPAT_THRESH = parseFloat(document.getElementById("compat_threshold").value);
        }

        if (document.activeElement.id !== "agent_neighbor_count") {
            params.AGENT_NEIGHBOR_COUNT = parseInt(document.getElementById("agent_neighbor_count").value);
        }


        if (document.activeElement.id !== "fitness_calories") {
            if (document.getElementById("fitness_calories") && document.getElementById("fitness_calories").value)
                params.FITNESS_CALORIES = parseFloat(document.getElementById("fitness_calories").value);
        }

        if (document.activeElement.id !== "FITNESS_HUNTING_PREY") {
            params.FITNESS_HUNTING_PREY = parseFloat(document.getElementById("FITNESS_HUNTING_PREY").value);
        }

        if (document.activeElement.id !== "FITNESS_BUMPING_INTO_WALL") {
            params.FITNESS_BUMPING_INTO_WALL = parseFloat(document.getElementById("FITNESS_BUMPING_INTO_WALL").value);
        }

        if (document.activeElement.id !== "FITNESS_OUT_OF_BOUND") {
            params.FITNESS_OUT_OF_BOUND = parseFloat(document.getElementById("FITNESS_OUT_OF_BOUND").value);
        }

        if (document.activeElement.id !== "fitness_potential_cal") {
            params.FITNESS_POTENTIAL_CALORIES = parseFloat(document.getElementById("fitness_potential_cal").value);
        }

        if (document.activeElement.id !== "FITNESS_ENERGY_EFFICIENCY") {
            params.FITNESS_ENERGY_EFFICIENCY = parseFloat(document.getElementById("FITNESS_ENERGY_EFFICIENCY").value);
        }

        if (document.activeElement.id !== "FITNESS_PERCENT_DEAD") {
            params.FITNESS_PERCENT_DEAD = parseFloat(document.getElementById("FITNESS_PERCENT_DEAD").value);
        }

        if (document.activeElement.id !== "FITNESS_WINNER_BONUS") {
            params.FITNESS_WINNER_BONUS = parseFloat(document.getElementById("FITNESS_WINNER_BONUS").value);
        }

        if (document.activeElement.id !== "num_prey") {
            params.num_prey = parseInt(document.getElementById("num_prey").value);
        }

        if (document.activeElement.id !== "predator_ratio") {
            params.predator_ratio = parseInt(document.getElementById("predator_ratio").value);
        }

        if (document.activeElement.id !== "max_ticks_to_consume") {
            params.MAX_TICKS_TO_CONSUME = parseInt(document.getElementById("max_ticks_to_consume").value);
        }

        if (document.activeElement.id !== "food_diameter") {
            params.FOOD_DIAMETER = parseFloat(document.getElementById("food_diameter").value);
        }

        if (document.activeElement.id !== "agent_max_speed") {
            params.AGENT_MAX_SPEED = parseFloat(document.getElementById("agent_max_speed").value);
        }

        if (document.activeElement.id !== "agent_diameter") {
            params.AGENT_DIAMETER = parseFloat(document.getElementById("agent_diameter").value);
        }

        if (document.activeElement.id !== "cooldown_to_regen") {
            params.COOLDOWN_TO_REGEN = parseInt(document.getElementById("cooldown_to_regen").value);
        }

        if (document.activeElement.id !== "tickToUpdateCurrentGenOutputData") {
            params.TICK_TO_UPDATE_CURRENT_GEN_DATA = parseInt(document.getElementById("tickToUpdateCurrentGenOutputData").value);
        }

        if (document.activeElement.id !== "gen_to_save") {
            params.GEN_TO_SAVE = parseInt(document.getElementById("gen_to_save").value);
        }

        if (document.activeElement.id !== "gen_to_save_genome") {
            params.GEN_TO_SAVE_GENOME = parseInt(document.getElementById("gen_to_save_genome").value);
        }

        if (document.activeElement.id !== "db") {
            params.DB = document.getElementById("db").value;
        }

        if (document.activeElement.id !== "db_collection") {
            params.DB_COLLECTION = document.getElementById("db_collection").value;
        }

        if (document.activeElement.id !== "genome_db") {
            params.GENOME_DB = document.getElementById("genome_db").value;
        }

        if (document.activeElement.id !== "genome_db_collection") {
            params.GENOME_DB_COLLECTION = document.getElementById("genome_db_collection").value;
        }

        if (document.activeElement.id !== "sim_trial_num") {
            params.SIM_TRIAL_NUM = parseInt(document.getElementById("sim_trial_num").value);
        }

        params.SAVE_TO_DB = document.getElementById("save_to_db").checked;
        params.AUTO_SAVE_GENOME = document.getElementById("auto_save_genome").checked;
        params.coevolution = document.getElementById("coevolution").checked;

        this.checkFoodLevels();

        if (params.TICK_TO_UPDATE_CURRENT_GEN_DATA !== 0 && this.tickCounter % params.TICK_TO_UPDATE_CURRENT_GEN_DATA == 0) {
            //Output the Charts for current generation data
            generateNeuralNetWorkData(this.currentLeftWheelHist, 'agentCurrentLeftWheelChart', 'agentCurrentOutputContainers');
            execAsync(this.currentLeftWheelHist.data.push(new Array(20).fill(0)));

            generateNeuralNetWorkData(this.currentRightWheelHist, 'agentCurrentRightWheelChart', 'agentCurrentOutputContainers');
            execAsync(this.currentRightWheelHist.data.push(new Array(20).fill(0)));

            if (params.AGENT_BITING) {
                execAsync(generateNeuralNetWorkData(this.currentBiteHist, 'agentCurrentBitingChart', 'agentCurrentOutputContainers'));
                this.currentBiteHist.data.push(new Array(20).fill(0));
            }

            PopulationManager.CURRENT_GEN_DATA_GATHERING_SLOT++;
        }

        this.tickCounter++;
        //Use for debugging purposes; to determine whether the current population is at its last tick
        if (this.tickCounter + 1 >= params.GEN_TICKS) {
            PopulationManager.IS_LAST_TICK = true;
        }
        else {
            PopulationManager.IS_LAST_TICK = false;
        }
        //Check to see if the generation is over
        if (this.tickCounter >= params.GEN_TICKS) {
            //When a new generation starts 
            params.EVOLVE_K_AND_M = document.getElementById("evolveKandM").checked; // Update the evolving k and m value
            //Reset counters

            //For debugging k and m purposes
            //console.clear();
            this.tickCounter = 0;
            if (params.MIRROR_ROLES && !this.rolesMirrored && !params.coevolution) {
                this.resetAgents(false);
                this.swapHierarchyValues();

                //Clean up the food  
                this.resetAllWorldsFood();
                this.checkFoodLevels();
            } else {
                this.processGeneration(this.agentsAsList());
            }
            this.rolesMirrored = !this.rolesMirrored;

            if (document.activeElement.id !== "generation_time") {
                params.GEN_TICKS = parseInt(document.getElementById("generation_time").value);
            }

            return true;
        }
        return false;
    };

    resetAgents(newGen = true) {
        if (!params.FREE_RANGE) {
            //Update food hierarchy of all agents in all world
            this.updateWorldsFoodHierarchy();

            this.agentsAsList().forEach(agent => {
                if (params.HUNTING_MODE === "deactivated") {
                    agent.moveToWorldCenter();
                }
                agent.resetOrigin();
                agent.activateAgent();
                if (newGen) {
                    agent.resetCalorieCounts();
                    agent.resetCounters();
                }
            });
        }
    }

    swapHierarchyValues() {
        this.worlds.forEach(world => {
            if (world.agents) {
                world.swapFoodHierarchies();
            }
        });
    }

    isFoodGone() {

        let food = this.foodAsList(false).concat(this.foodAsList(true));
        for (const element of food) {
            if (!element.removeFromWorld) {
                return false;
            }
        }
        return true;
    };

    isAgentEnergyGone() {
        let agents = this.agentsAsList();
        for (const element of agents) {
            if (element.energy > Agent.DEATH_ENERGY_THRESH) {
                return false;
            }
        }
        return true;

    };

    resetAllWorldsFood() {
        this.worlds.forEach((members, worldId) => {
            members.resetFood();

        });
    }

    checkFoodLevels() { // periodic food/poison repopulation function
        this.worlds.forEach((members, worldId) => {
            members.cleanupFood(true);
            members.cleanupFood(false);

            let beforeFood = members.food.length;
            if (params.ENFORCE_MIN_FOOD && (members.food.length < params.FOOD_AGENT_RATIO * members.agents.length)) {
                this.spawnFood(worldId, false, params.FOOD_AGENT_RATIO * members.agents.length - members.food.length);
            }
            if (params.ENFORCE_MIN_POISON && (members.poison.length < params.POISON_AGENT_RATIO * members.agents.length)) {
                this.spawnFood(worldId, true, params.POISON_AGENT_RATIO * members.agents.length - members.poison.length);
            }


        });
    };

    getEntitiesInWorld(worldId, foodOnly = false, agentsOnly = false) {
        if (!this.worlds){
            return [];
        }
        let members = this.worlds.get(worldId);
        if (!members)
            return [];
        if (foodOnly) {
            return members.food.concat(members.poison);
        } else if (agentsOnly) {
            return members.agents;
        } else {
            return members.food.concat(members.poison, members.agents);
        }
    };

    spawnAgents(worldId, numberOfAgentsToSpawn = PopulationManager.NUM_PREY) {
        //Creating a new species
        if (params.AGENT_PER_WORLD == 0) {
            PopulationManager.PREY_SPECIES_MEMBERS.set(PopulationManager.PREY_SPECIES_ID, []);
            PopulationManager.SPECIES_CREATED++;
        }


        if(params.coevolution) {
            let predator = new Agent(this.game, params.CANVAS_SIZE / 2, params.CANVAS_SIZE / 2, undefined, 1);
            predator.speciesId = PopulationManager.PREDATOR_SPECIES_ID;
            predator.worldId = worldId;
           // predator.foodHierarchyIndex = 1; // outright set the agent to be a predator
            PopulationManager.PREDATOR_SPECIES_MEMBERS.get(PopulationManager.PREDATOR_SPECIES_ID).push(predator)
            this.worlds.get(worldId).agents.push(predator);
        }
        for (let i = 0; i < numberOfAgentsToSpawn; i++) { // add agents
            let agent = new Agent(this.game, params.CANVAS_SIZE / 2, params.CANVAS_SIZE / 2);
            agent.speciesId = PopulationManager.PREY_SPECIES_ID;
            agent.worldId = worldId;
            PopulationManager.PREY_SPECIES_MEMBERS.get(PopulationManager.PREY_SPECIES_ID).push(agent);
            this.worlds.get(worldId).agents.push(agent);
            // if(params.coevolution) { // if coevolution selected, set these agents to be prey
            //     agent.foodHierarchyIndex = 0;
            // }
        }
    };

    spawnFood(worldId, poison = false, count = (poison ? params.POISON_AGENT_RATIO : params.FOOD_AGENT_RATIO) * this.worlds.get(worldId).agents.length) {
        let maxFoodCount = (poison ? params.POISON_AGENT_RATIO : params.FOOD_AGENT_RATIO) * this.worlds.get(worldId).agents.length;
        let currentCount = poison ? this.worlds.get(worldId).poison.length : this.worlds.get(worldId).food.length;

        //Do not spawn food if current food is too much
        if (maxFoodCount <= currentCount) {
            return;
        }


        let seedlings = [];
        let index = 0;
        let spawnSlot = [];
        let podLength = poison ? this.poisonPodLayout.length : this.foodPodLayout.length;

        for (let i = 0; i < podLength; i++) {
            spawnSlot[i] = i;
        }

        if (params.RANDOMIZE_FOOD_SPAWN_PATTERN) {
            spawnSlot = shuffleArray(spawnSlot);
        }

        for (let i = 0; i < count; i++) { // add food sources
            let spawnIndex = spawnSlot[index];
            let pod = poison ? this.poisonPodLayout[spawnIndex] : this.foodPodLayout[spawnIndex];
            let loc = pod.genFoodPos();
            seedlings.push(new Food(this.game, loc.x, loc.y, poison, this.foodTracker, worldId));
            index = (index + 1) % podLength;
        }

        this.registerSeedlings(worldId, seedlings);
    };

    registerSeedlings(worldId, seedlings) {
        seedlings.forEach(seedling => {
            seedling.worldId = worldId;
            if (seedling.isPoison) {
                this.worlds.get(worldId).poison.push(seedling);
            } else {
                this.worlds.get(worldId).food.push(seedling);
            }
        });
    };

    registerChildAgents(children, speciesMap, hierarchy) {
        let repMap = new Map();
        speciesMap.forEach((speciesList, speciesId) => {
            // choose a rep for each species
            repMap.set(speciesId, speciesList[0]);
        });

        let compatOrder = [...repMap.keys()].sort(); // sort by speciesId such that compatibility is always considered in the same order
        children.forEach(child => { // fit child into a species
            let matchFound = false;
            compatOrder.forEach(speciesId => {
                let rep = repMap.get(speciesId);
                if (!matchFound && Genome.similarity(rep.genome, child.genome) <= params.COMPAT_THRESH) { // species matched
                    matchFound = true;
                    child.speciesId = speciesId;
                    speciesMap.get(speciesId).push(child);
                }
            });

            if (!matchFound) { // no compatible, creating a new species
                PopulationManager.SPECIES_CREATED++;
                if(hierarchy == 0) {
                    child.speciesId = ++PopulationManager.PREY_SPECIES_ID;
                    PopulationManager.PREY_SPECIES_MEMBERS.set(child.speciesId, []);
                } else {
                    child.speciesId = ++PopulationManager.PREDATOR_SPECIES_ID;
                    PopulationManager.PREDATOR_SPECIES_MEMBERS.set(child.speciesId, []);
                }

                
                let newColor = randomInt(361);
                while (PopulationManager.COLORS_USED.has(newColor)) {
                    newColor = randomInt(361);
                }
                PopulationManager.COLORS_USED.add(newColor);
                PopulationManager.SPECIES_COLORS.set(child.speciesId, newColor);
                let newSensorColor = AgentInputUtil.randomBlueHue();
                while (PopulationManager.SENSOR_COLORS_USED.has(newSensorColor)) {
                    newSensorColor = AgentInputUtil.randomBlueHue();
                }
                PopulationManager.SENSOR_COLORS_USED.add(newSensorColor);
                PopulationManager.SPECIES_SENSOR_COLORS.set(child.speciesId, newSensorColor);
                speciesMap.get(child.speciesId).push(child);
                repMap.set(child.speciesId, child); // child becomes representative for next children
                compatOrder = [...repMap.keys()].sort(); // resort the compatibility ordering

                if (params.SPLIT_SPECIES) {
                    if (params.AGENT_PER_WORLD === 0) {
                        //Create a new world for the new specie 
                        PopulationManager.WORLD_CREATED++;
                        let world = this.initNewWorld(child.speciesId);
                        this.specieWorldList.set(child.speciesId, [child.speciesId]);
                        this.spawnFood(child.speciesId, false, params.FOOD_AGENT_RATIO);
                        this.spawnFood(child.speciesId, true, params.POISON_AGENT_RATIO);
                        world.speciesList.add(child.speciesId);
                    } else {
                        this.specieWorldList.set(child.speciesId, [++PopulationManager.WORLD_CREATED]);
                    }
                }
            }
            //Push the agents into a world
            if (params.AGENT_PER_WORLD === 0) {

                let world = this.worlds.get(params.SPLIT_SPECIES ? child.speciesId : 0);
                //Create a new world when the world has not been created
                if (!world) {
                    world = this.initNewWorld(child.speciesId);
                    this.spawnFood(child.speciesId, false, params.FOOD_AGENT_RATIO);
                    this.spawnFood(child.speciesId, true, params.POISON_AGENT_RATIO);
                }
                world.agents.push(child);
                child.worldId = child.speciesId;
                world.speciesList.add(child.speciesId);
            }
        });

        //Update the spec for minimap
        PopulationManager.MINIMAP.updateSpec(this.worlds.size);
    };

    countDeads(worldId = undefined) {
        if (worldId != undefined) {
            return this.worlds.get(worldId).countDeads();
        }

        let count = 0;
        this.worlds.forEach(world => {
            count += world.countDeads();
        });

        return count;
    };

    // Return a tuple of 
    countAlives(worldId = undefined) {
        if (worldId != undefined) {
            return this.worlds.get(worldId).countAlives();
        }

        let aliveCount = [];
        let preyCount = 0;
        let predatorCount = 0;
        this.worlds.forEach(world => {
            preyCount += world.countPreyAlive();
            predatorCount += world.countPredatorsAlive();
        });

        aliveCount[0] = preyCount;
        aliveCount[1] = predatorCount;
        
        return aliveCount;
    };

    agentsAsList() {
        let agents = [];
        this.worlds.forEach(members => {
            agents.push(...members.agents);
        });
        return agents;
    };

    foodAsList(poison = false) {
        let food = [];
        this.worlds.forEach(members => {
            let list = poison ? members.poison : members.food;
            food.push(...list);
        });
        return food;
    };

    /**
     * Distribute agents to their world
     * ONLY WORLD WITH LIMITING AGENT PER WORLD OPTION
     */
    // Change this if we add multiple predators as a possibility
    distributeAgents() {
        //EXIT IF NOT IN AGENT PER WORLD MODE
        if (params.AGENT_PER_WORLD === 0) {
            return;
        }

        this.worlds.forEach((world) => {
            PopulationManager.WORLD_COLOR_POOL.push(world.worldColor);
        });

        //Clear the pre-existing worlds
        this.worlds = new Map();
        let worldId = -1;

        let agentDistributed = 0; //For debugging purpose
        //Resetting the species by world list
        this.preySpeciesWorldList = new Map();
        let preySpeciesAllocationList = [];
        this.predatorSpeciesWorldList = new Map();
        let predatorSpeciesAllocationList = [];



        // deprecated
        if (params.SPLIT_SPECIES) {
            PopulationManager.PREY_SPECIES_MEMBERS.forEach((species) => {
                preySpeciesAllocationList.push(species);
            });

        }
        else {
            // Not splitting species
            // Add the agents into one container and shuffle it up
            let agentPool = [];
            PopulationManager.PREY_SPECIES_MEMBERS.forEach((species, speciesId) => {
                agentPool.push(...species);
            });
            agentPool = shuffleArray(agentPool);
            preySpeciesAllocationList.push(agentPool);
            if (params.coevolution) {
                agentPool = [];
                PopulationManager.PREDATOR_SPECIES_MEMBERS.forEach((species, speciesId) => {
                    agentPool.push(...species);
                });
                agentPool = shuffleArray(agentPool);
                predatorSpeciesAllocationList.push(agentPool);
            }
        }
        if (!params.coevolution) {
        preySpeciesAllocationList.forEach((agentContainer) => {
            // Resetting the species by world list
            let speciesId = agentContainer[0].speciesId;
            this.preySpeciesWorldList.set(speciesId, []);

            for (let i = agentContainer.length - 1; i >= 0; --i) {
                let agent = agentContainer[i];

                // No world like it has been created or it's full
                // Adds +1 to spawn number to account for not placing a predator manually
                if (!this.worlds.get(worldId) || this.worlds.get(worldId).agents.length >= params.predator_ratio + 1) {
                    ++worldId;
                    let world = this.initNewWorld(worldId);
                    this.preySpeciesWorldList.get(speciesId).push(worldId);
                    agent.worldId = worldId;
                    world.agents.push(agent);
                    world.preySpeciesList.add(agent.speciesId);
                    ++agentDistributed;
                } else {
                    agent.worldId = worldId;
                    let world = this.worlds.get(worldId);
                    world.agents.push(agent);
                    world.preySpeciesList.add(agent.speciesId);
                    ++agentDistributed;
                }

            }
            ++worldId;
        });
        } else {
            console.log(preySpeciesAllocationList)
            preySpeciesAllocationList.forEach((agentContainer) => {
                // Resetting the species by world list
                let speciesId = agentContainer[0].speciesId;
                this.preySpeciesWorldList.set(speciesId, []);
                this.predatorSpeciesWorldList.set(speciesId, []);
    
                for (let i = agentContainer.length - 1; i >= 0; --i) {
                    let agent = agentContainer[i];
    
                    // No world like it has been created or it's full
                    if (!this.worlds.get(worldId) || this.worlds.get(worldId).agents.length >= params.predator_ratio) {
                        ++worldId;
                        let world = this.initNewWorld(worldId);
                        let predator = predatorSpeciesAllocationList[0][worldId]
                        this.preySpeciesWorldList.get(speciesId).push(worldId);
                        this.predatorSpeciesWorldList.get(speciesId).push(worldId);
                        predator.worldId = worldId;
                        agent.worldId = worldId;
                        world.agents.push(agent);
                        world.agents.push(predator);
                        world.preySpeciesList.add(agent.speciesId);
                        world.predatorSpeciesList.add(predator.speciesId)
                        ++agentDistributed;
                    } else {
                        agent.worldId = worldId;
                        let world = this.worlds.get(worldId);
                        world.agents.push(agent);
                        world.preySpeciesList.add(agent.speciesId);
                        ++agentDistributed;
                    }
    
                }
                ++worldId;
            });
        }
        PopulationManager.WORLD_CREATED = worldId;
        //Update the spec for minimap
        PopulationManager.MINIMAP.updateSpec(this.worlds.size);
    }

    cleanUpWorlds() {
        let extincts = [];
        this.worlds.forEach((world, worldId) => {
            world.cleanupAgents();
            if (world.agents.length === 0 || world.countAlives() == 0) {
                extincts.push(worldId);
            }
        });
        if (params.SPLIT_SPECIES) {
            extincts.forEach(worldId => {
                //Cleaning up world color here

                this.removeWorld(worldId);
                //Clean up in the agent list
                this.specieWorldList.forEach(x => {
                    for (let i = x.length - 1; i >= 0; i--) {
                        if (worldId == x[i]) {
                            x.splice(i, 1);

                        }
                    }
                });
            });
        }

        //Tidy up specie members and the color list
        //Only active when limiting agents per world is on for reason of backward compability (Disable for now)
        //if (params.AGENT_PER_WORLD !== 0) {
        PopulationManager.PREY_SPECIES_MEMBERS.forEach((specie, speciesId) => {
            for (let i = specie.length - 1; i >= 0; --i) {
                let agent = specie[i];
                if (agent.removeFromWorld) {
                    specie.splice(i, 1);
                }
            }
            if (specie.length == 0) {
                PopulationManager.PREY_SPECIES_MEMBERS.delete(speciesId);
                PopulationManager.SPECIES_COLORS.delete(speciesId);
            }
        });

        PopulationManager.PREDATOR_SPECIES_MEMBERS.forEach((specie, speciesId) => {
            for (let i = specie.length - 1; i >= 0; --i) {
                let agent = specie[i];
                if (agent.removeFromWorld) {
                    specie.splice(i, 1);
                }
            }
            if (specie.length == 0) {
                PopulationManager.PREDATOR_SPECIES_MEMBERS.delete(speciesId);
                PopulationManager.SPECIES_COLORS.delete(speciesId);
            }
        });
        //}

    }

    initNewWorld(worldId) {
        let world = new World(this.game, worldId);
        this.worlds.set(worldId, world);

        if (params.FREE_RANGE) {
            this.resetCanvases();
        }
        return world;
    };

    //Update food hierarchy of all agents in all world
    updateWorldsFoodHierarchy() {
        //Hunting mode is turned off
        if (params.HUNTING_MODE === "deactivated") {
            return;
        }
        this.worlds.forEach(world => {
            world.activate();
            world.updateFoodHierarchy();
        });
    }

    createWorldCanvas(worldId) {
        let canvas = document.createElement("canvas");
        canvas.id = `${worldId}`;
        canvas.width = params.CANVAS_SIZE;
        canvas.height = params.CANVAS_SIZE;
        canvas.style.border = "1px solid black";
        return canvas;
    };

    activateWorld(worldId) {
        this.worlds.get(worldId).activate();
    }

    deactivateWorld(worldId) {
        this.worlds.get(worldId).deactivate();
    }

    removeWorld(worldId) {
        //Replenish the world color pool
        PopulationManager.WORLD_COLOR_POOL.push(this.worlds.get(worldId).worldColor);

        this.worlds.get(worldId).removeWorld();
        this.worlds.delete(worldId);
    };

    mergeWorlds() {
        let allAgents = this.agentsAsList();
        let allFood = this.foodAsList();
        allFood.forEach(food => food.worldId = 0); // reset the world id of all food
        let allPoison = this.foodAsList(true);
        allPoison.forEach(poison => poison.worldId = 0); // reset the world id of all poison
        this.worlds = new Map();

        this.initNewWorld(0);
        this.worlds.get(0).agents = allAgents;
        this.worlds.get(0).food = allFood;
        this.worlds.get(0).poison = allPoison;

        this.resetCanvases();
        this.resetWorldColorPool();
    };

    splitWorlds() {
        let allAgents = this.agentsAsList();
        let allFood = this.foodAsList();
        let allPoison = this.foodAsList(true);
        this.worlds = new Map();
        allAgents.forEach(agent => {
            if (this.worlds.get(agent.worldId) === undefined) {
                this.initNewWorld(agent.worldId);
            }
            this.worlds.get(agent.worldId).agents.push(agent);
        });
        let worldIds = [...this.worlds.keys()];
        let index = 0;
        allFood.forEach(f => {
            f.worldId = worldIds[index];
            this.worlds.get(worldIds[index]).food.push(f);
            index = (index + 1) % worldIds.length;
        });
        index = 0;
        allPoison.forEach(p => {
            p.worldId = worldIds[index];
            this.worlds.get(worldIds[index]).poison.push(p);
            index = (index + 1) % worldIds.length;
        });
        this.resetCanvases();
        this.resetWorldColorPool();
    };

    resetCanvases() {
        const tmp = [];
        this.worlds.forEach((val) => {
            tmp.push({ canvas: val.canvas, id: val.worldId });
        });
        createSlideShow(tmp, 'canvas');
    };

    /**
     * Collect data during the run and put them into agent trackers
     */
    // TODO: allow this to track predator too
    processRawData() {
        let specieOOBData = new Map();
        let specieFoodEatenData = new Map();
        let speciePreyHuntedData = new Map();
        let sumPercDead = 0;
        let sumEnergySpent = 0;
        let sumPredWinnerBonus = 0;
        let totalOOB_Prey = 0;
        let totalOOB_Predator = 0;
        let huntingMode = params.HUNTING_MODE === "hierarchy" || params.HUNTING_MODE === "hierarchy_spectrum";
        this.agentsAsList().forEach((agent) => {
            if (!params.coevolution || agent.foodHierarchyIndex==0) {
            let OOBData = specieOOBData.get(agent.speciesId);
            specieOOBData.set(agent.speciesId,
                (OOBData ? OOBData : 0) + agent.numberOfTickOutOfBounds
            );
            

            let FoodEatenData = specieFoodEatenData.get(agent.speciesId);
            specieFoodEatenData.set(agent.speciesId,
                (FoodEatenData ? FoodEatenData : 0) + agent.numberOfFoodEaten
            );

            let PreyHuntedData = speciePreyHuntedData.get(agent.speciesId);
            speciePreyHuntedData.set(agent.speciesId,
                (PreyHuntedData ? PreyHuntedData : 0) + agent.numberOfPreyHunted
            );
            sumPercDead += agent.getPercentDead();
            sumEnergySpent += agent.caloriesSpent;
            sumPredWinnerBonus += agent.getWinnerBonus("predator");

            //Collecting calories consume info
            if (huntingMode && agent.foodHierarchyIndex === 0){
                this.agentTracker.addToAttribute('totalCaloriesConsumedAsPrey', agent.caloriesEaten);
            }

            //Collecting out of bound info
            this.agentTracker.addToAttribute('totalTicksOutOfBounds_Prey', agent.numberOfTickOutOfBounds_Prey);
            this.agentTracker.addToAttribute('totalTicksOutOfBounds_Predator', agent.numberOfTickOutOfBounds_Predator);

            this.agentTracker.addToAttribute('totalPreyHuntedCount', agent.numberOfPreyHunted);
        }
        });

        //Log the data into agent Tracker
        specieOOBData.forEach((data, speciesId) => {
            console.log(specieOOBData)
            let entry = {};
            entry['speciesId'] = speciesId;
            console.log("prey species members: " + PopulationManager.PREY_SPECIES_MEMBERS)
            entry['speciesTotalTickOutOfBound'] = data / PopulationManager.PREY_SPECIES_MEMBERS.get(speciesId).length * 100;
            this.agentTracker.addSpeciesAttribute('speciesTotalTickOutOfBound', entry);

            this.agentTracker.addToAttribute('totalTicksOutOfBounds', data);

        });

        specieFoodEatenData.forEach((data, speciesId) => {
            let entry = {};
            entry['speciesId'] = speciesId;
            entry['speciesFoodConsumptionCount'] = data / PopulationManager.PREY_SPECIES_MEMBERS.get(speciesId).length;
            this.agentTracker.addSpeciesAttribute('speciesFoodConsumptionCount', entry);

            this.agentTracker.addToAttribute('totalFoodConsumptionCount', data);
        });

        speciePreyHuntedData.forEach((data, speciesId) => {
            let entry = {};
            entry['speciesId'] = speciesId;
            entry['speciesSuccessfulHuntCount'] = data / PopulationManager.PREY_SPECIES_MEMBERS.get(speciesId).length;
            this.agentTracker.addSpeciesAttribute('speciesSuccessfulHuntCount', entry);

     
        });

        //Add averages to agent tracker
        this.agentTracker.addAvgPercDead(sumPercDead / PopulationManager.NUM_PREY + PopulationManager.NUM_PREDATOR * 100);
        this.agentTracker.addAvgEnergySpent(sumEnergySpent / PopulationManager.NUM_PREY + PopulationManager.NUM_PREDATOR);
        let predWinnerBonus = sumPredWinnerBonus / PopulationManager.NUM_PREY + PopulationManager.NUM_PREDATOR;
        if (!params.MIRROR_ROLES) predWinnerBonus *= 2;
        this.agentTracker.addAvgPredWinnerBonus(predWinnerBonus);
    }

    displayDataChart() {
        //Generate the line chart for prey hunting 
        if (params.HUNTING_MODE === "hierarchy" || params.HUNTING_MODE === "hierarchy_spectrum") {
            this.preyConsumedData.chart.addEntry(this.agentTracker.getCurrentGenAttriBute('totalPreyHuntedCount'));
            generateLineChart({ chart: this.preyConsumedData.chart }, "preyHuntedLineChart", "lineChartOutputContainters");

            this.preyCaloriesEatenData.chart.addEntry(this.agentTracker.getCurrentGenAttriBute('totalCaloriesConsumedAsPrey'));
            generateLineChart({ chart: this.preyCaloriesEatenData.chart }, "caloriesPreyEatenLineChart", "lineChartOutputContainters");

            generateLineChart(
                {
                    data: this.agentTracker.getAgentTrackerAttributesAsList('totalTicksOutOfBounds_Predator'),
                    title: 'Total Ticks Out of Bounds AS Predator Per Generation'
                },
                "totalTicksOOBPredatorLineChart", "lineChartOutputContainters",
            );

            generateLineChart(
                {
                    data: this.agentTracker.getAgentTrackerAttributesAsList('totalTicksOutOfBounds_Prey'),
                    title: 'Total Ticks Out of Bounds AS Prey Per Generation'
                },
                "totalTicksOOBPreyLineChart", "lineChartOutputContainters",
            );

            generateLineChart(
                {
                    data: this.agentTracker.getAgentTrackerAttributesAsList('avgPredWinnerBonus'),
                    title: 'Average Hunting Bonus of An Agent Per Generation'
                },
                "avgPredWinnerBonusLineChart", "lineChartOutputContainters",
            );
        }

        generateLineChart(
            {
                data: this.agentTracker.getAgentTrackerAttributesAsList('totalFoodConsumptionCount'),
                title: 'Total Food Consumption Per Generation'
            },
            "foodConsumptionLineChart", "lineChartOutputContainters",
        );
        generateLineChart(
            {
                data: this.agentTracker.getAgentTrackerAttributesAsList('totalTicksOutOfBounds'),
                title: 'Total Ticks Out of Bounds Per Generation'
            },
            "totalTicksOOBLineChart", "lineChartOutputContainters",
        );

        generateLineChart(
            {
                data: this.agentTracker.getAgentTrackerAttributesAsList('avgEnergySpent'),
                title: ' Average Energy Spent of An Agent Per Generation '
            },
            "avgEnergySpentLineChart", "lineChartOutputContainters",
        );
        generateLineChart(
            {
                data: this.agentTracker.getAgentTrackerAttributesAsList('avgPercDead'),
                title: 'Average Percentage of Ticks Deactivated Per Generation'
            },
            "avgPercDeadLineChart", "lineChartOutputContainters",
        );

        generateLineChart(
            {
                data: this.agentTracker.getAgentTrackerAttributesAsList('avgFitness'),
                title: 'Average Fitness Per Generation'
            },
            "avgFitnessLineChart", "lineChartOutputContainters",
        );

        generateLineChart(
            {
                data: this.foodTracker.getConsumptionData(),
                title: 'Total Calories Consumed Per Generation'
            },
            "avgCaloriesLineChart", "lineChartOutputContainters",
        );      

        //Generates the data charts
        //generateFitnessChart(this.agentTracker.getAgentTrackerAttributesAsList("speciesFitness"));//getAgentTrackerAttributesAsList("avgFitness"));
        //generateAgeChart(this.agentTracker.getAgeData());
        //generateFoodConsumptionChart(this.foodTracker.getConsumptionData());
        //generateFoodStageChart(this.foodTracker.getLifeStageData());
        //generateConnectionChart(this.genomeTracker.getConnectionData());
        //generateCycleChart(this.genomeTracker.getCycleData());
        //generateNodeChart(this.genomeTracker.getNodeData());
        //generateCurrentFitnessChart(this.agentTracker.getAgentTrackerAttributesAsList("speciesFitness"));

        //generateSpecieAttributeBarChart(this.agentTracker.getCurrentGenAttriBute('speciesSuccessfulHuntCount'),
        //    'speciesSuccessfulHuntCount', "Current Gen Successful hunt Percentage Per Specie", 'specieSuccessfulHuntCountChart');

        //generateSpecieAttributeBarChart(this.agentTracker.getCurrentGenAttriBute('speciesFoodConsumptionCount'),
        //    'speciesFoodConsumptionCount', "Current Gen Average Food Consumption Count Per Specie", 'speciesFoodConsumptionCountChart');

        //generateSpecieAttributeBarChart(this.agentTracker.getCurrentGenAttriBute('speciesTotalTickOutOfBound'),
        //    'speciesTotalTickOutOfBound', "Current Gen Average Ticks Out Of Bound Per Specie", 'speciesTotalTickOutOfBoundChart');
    }

    processGeneration() {
        //Data collections for histograms
        let avgLeftWheelOut = new Array(20).fill(0);
        let avgRightWheelOut = new Array(20).fill(0);
        let avgBiteOut = new Array(20).fill(0);
        //evaluate the agents
        let totalRawFitness = 0;
        let totalGenTicks = params.GEN_TICKS * (params.MIRROR_ROLES ? 2 : 1);

        //Collect data for the other charts
        this.processRawData();
        this.agentsAsList().forEach(agent => {
            this.agentTracker.processAgent(agent);
            this.genomeTracker.processGenome(agent.genome);
            agent.age++;
            agent.assignFitness();
            totalRawFitness += agent.genome.rawFitness;
            //Sort average output data for the histograms into their buckets
            avgLeftWheelOut[determineBucket(agent.totalOutputs[0] / totalGenTicks, -1, 1)]++;
            avgRightWheelOut[determineBucket(agent.totalOutputs[1] / totalGenTicks, -1, 1)]++;
            if (params.AGENT_BITING) avgBiteOut[determineBucket(agent.totalOutputs[2] / totalGenTicks, -1, 1)]++;
        });
        this.agentTracker.addAvgFitness(totalRawFitness / (PopulationManager.NUM_PREY + PopulationManager.NUM_PREDATOR)); // TODO: correct fitness function calcs
        Genome.resetInnovations(); // reset the innovation number mapping for newly created connections
        let reprodFitMap = new Map();
        let predReprodFitMap = new Map();
        let minShared = 0;

        //Determine average raw fitness for each species
        PopulationManager.PREY_SPECIES_MEMBERS.forEach((speciesList, speciesId) => {
            //sum raw fitness for all members of this species
            let sumRaws = 0;
            speciesList.forEach(member => {
                console.log("raw fitness for prey: " + member.genome.rawFitness)
                sumRaws += member.genome.rawFitness;
            });
            console.log("prey species list length: " + speciesList.length)
            minShared = Math.min(minShared, sumRaws / speciesList.length);
            reprodFitMap.set(speciesId, sumRaws / speciesList.length);
        });
        //Determines the avg fitness for each species after adding the abs val minimum negative fitness? - gabe
        let sumShared = 0;
        let predSumShared = 0;
        //Build the fitness chart for the species
        reprodFitMap.forEach((fitness, speciesId) => {
            console.log(speciesId)
            const newFit = fitness + minShared * -1 + 10;
            reprodFitMap.set(speciesId, newFit);
            console.log(sumShared)
            sumShared += reprodFitMap.get(speciesId);
            this.agentTracker.addSpeciesFitness({ speciesId, fitness: fitness });
        });

        if(params.coevolution) {
            minShared = 0;
            console.log("coevolution read correctly inside processgeneration")
            //Determine average raw fitness for each species
            PopulationManager.PREDATOR_SPECIES_MEMBERS.forEach((speciesList, speciesId) => {
            //sum raw fitness for all members of this species
            let sumRaws = 0;

            speciesList.forEach(member => {
                if (!isNaN(member.genome.rawFitness)) {
                sumRaws += member.genome.rawFitness;
                }
            });
            console.log(sumRaws)
            minShared = Math.min(minShared, sumRaws / speciesList.length);
            predReprodFitMap.set(speciesId, sumRaws / speciesList.length);
        });

        console.log("not broken after fitness function for ")
        //Determines the avg fitness for each species after adding the abs val minimum negative fitness? - gabe

        console.log(predReprodFitMap)
        //Build the fitness chart for the species
        predReprodFitMap.forEach((fitness, speciesId) => {
            // console.log(speciesId)
            const newFit = fitness + minShared * -1 + 10;
            predReprodFitMap.set(speciesId, newFit);
            predSumShared += predReprodFitMap.get(speciesId);
            // console.log(predSumShared)
            this.agentTracker.addSpeciesFitness({ speciesId, fitness: fitness });
        });
        console.log("not broken after predreprodmap")
        }

        //Selection process for killing off agents
        if (!params.FREE_RANGE) {
            this.deathRoulette(reprodFitMap, sumShared, PopulationManager.PREY_SPECIES_MEMBERS, 0);
            console.log("prey death roulette completed")
            if(params.coevolution) {
                this.deathRoulette(predReprodFitMap, predSumShared, PopulationManager.PREDATOR_SPECIES_MEMBERS, 1);
                console.log("predator death roulette completed")
            }
            this.crossover(reprodFitMap, sumShared, predReprodFitMap, predSumShared);
        }

        console.log("crossover and death roulette complete")

        //Clean up some of the dead worlds and balence agents count
        this.cleanUpWorlds();
        if (params.AGENT_PER_WORLD !== 0) {
            this.distributeAgents();
        }

        console.log("distribute agents complete")
        //Replenish food or poison
        this.checkFoodLevels();
        let remainingColors = new Set(); // we need to filter out the colors of species that have died out for reuse
        let remainingSensorColors = new Set(); // same thing with sensor colors
        PopulationManager.PREY_SPECIES_MEMBERS = new Map();
        PopulationManager.PREDATOR_SPECIES_MEMBERS = new Map();
        this.agentsAsList().forEach(agent => { // fill species members map with surviving parents and children
            if (PopulationManager.PREY_SPECIES_MEMBERS.get(agent.speciesId) === undefined && (!params.coevolution || agent.foodHierarchyIndex == 0)) {
                    PopulationManager.PREY_SPECIES_MEMBERS.set(agent.speciesId, []);
            } else if (PopulationManager.PREDATOR_SPECIES_MEMBERS.get(agent.speciesId) === undefined && params.coevolution && agent.foodHierarchyIndex > 0) {
                    PopulationManager.PREDATOR_SPECIES_MEMBERS.set(agent.speciesId, []);
            } 
            if (agent.foodHierarchyIndex > 0 && params.coevolution) {
                PopulationManager.PREDATOR_SPECIES_MEMBERS.get(agent.speciesId).push(agent);
            } else {
                PopulationManager.PREY_SPECIES_MEMBERS.get(agent.speciesId).push(agent);
            }
            remainingColors.add(PopulationManager.SPECIES_COLORS.get(agent.speciesId));
            remainingSensorColors.add(PopulationManager.SPECIES_SENSOR_COLORS.get(agent.speciesId));
        });

        console.log("redistributing members complete")
        PopulationManager.COLORS_USED = new Set([...PopulationManager.COLORS_USED].filter(color => remainingColors.has(color)));
        PopulationManager.SENSOR_COLORS_USED = new Set([...PopulationManager.SENSOR_COLORS_USED].filter(color => remainingSensorColors.has(color)));

        //Resets all agents
        /*if (!params.FREE_RANGE) {
            this.agentsAsList().forEach(agent => {
                if (params.HUNTING_MODE === "deactivated") {
                    agent.moveToWorldCenter();
                }
                agent.resetOrigin();
                agent.activateAgent();
                agent.resetCalorieCounts();
                agent.resetCounters();
            });
        }

        
        
        this.updateWorldsFoodHierarchy();*/

        //Clear current walls and add random walls to the map. Will be different for each world
        if (params.INNER_WALL) {
            this.worlds.forEach(world => {
                world.produceRandomWalls(2, params.CANVAS_SIZE / 3, params.CANVAS_SIZE / 6);
            });
        }
        this.resetAgents(true);

        //Generates the generational histograms
        this.leftWheelHist.data.push(avgLeftWheelOut);
        execAsync(generateNeuralNetWorkData(this.leftWheelHist, 'agentGenAvgLeftWheelChart', 'agentAvgOutputContainers'));

        this.rightWheelHist.data.push(avgRightWheelOut);
        execAsync(generateNeuralNetWorkData(this.rightWheelHist, 'agentGenAvgRightWheelChart', 'agentAvgOutputContainers'));

        if (params.AGENT_BITING) {
            this.biteHist.data.push(avgBiteOut);
            execAsync(generateNeuralNetWorkData(this.biteHist, 'agentGenAvgBiteChart', 'agentAvgOutputContainers'));
        }

        //Reset current generation Histogram
        this.currentLeftWheelHist.reset();
        this.currentRightWheelHist.reset();

        //Add to the number of prey consumed
        // this.preyConsumedData.chart.addEntry(0, [
        //     PopulationManager.GEN_NUM, this.preyConsumedData.currentGenData
        // ]);
        // this.preyConsumedData.currentGenData = 0;

        if (params.AGENT_BITING && this.currentBiteHist != null) this.currentBiteHist.reset();
        PopulationManager.CURRENT_GEN_DATA_GATHERING_SLOT = 0;

        this.displayDataChart();

        this.foodTracker.computePercentiles();
        //generateFoodTimeChart(this.foodTracker.getPercentileData());
        this.foodTracker.addNewGeneration();
        this.agentTracker.addNewGeneration();
        this.genomeTracker.addNewGeneration();

        //Runs database updates and checks to see if there is a  
        //trial end before incrementing the generation number
        if (!this.generationalDBUpdate()) {
            PopulationManager.GEN_NUM++;
            this.resetCanvases();
        }
    };

    loadFromGenomeList(data) {
        console.log("running genome loader...");
        console.log(data);
        this.resetSim();
        let genomes = data.genomes;
        let agents = this.agentsAsList();
        for (let i = 0; i < agents.length; i++) {
            agents[i].genome = genomes[i];
        }
        PopulationManager.GEN_NUM = data.generation + 1;
    }

    generationalDBUpdate() {
        let rValue = false;
        if (params.GEN_TO_SAVE_GENOME <= PopulationManager.GEN_NUM && params.AUTO_SAVE_GENOME) {
            saveGenomes();
            console.log("auto saved genomes!!");
        }
        if (params.SAVE_TO_DB && params.GEN_TO_SAVE <= PopulationManager.GEN_NUM && params.SIM_TRIAL_NUM >= params.SIM_CURR_TRIAL) {


            let data = {};
            let consumptionData = this.foodTracker.getConsumptionData();
            consumptionData = consumptionData.slice(0, consumptionData.length - 1);
            data.consumption = consumptionData;
            agentTrackerAttributesToCollect.forEach((attribute) => {
                let newCollection = this.agentTracker.getAgentTrackerAttributesAsList(attribute);
                newCollection = newCollection.slice(0, newCollection.length - 1);
                data[attribute] = newCollection;
            });

            //Sending data to data base
            if (params.SAVE_TO_DB) {
                logData(data, params.DB, params.DB_COLLECTION);
            }

            this.resetSim();
            if (params.SIM_TRIAL_NUM <= params.SIM_CURR_TRIAL) {
                //Call pausing button
                let pauseButton = document.getElementById('pause_sim');
                if (pauseButton) {
                    pauseButton.click();
                }
                let downloadDataButton = document.getElementById('db_download_data');
                if (downloadDataButton) {
                    downloadDataButton.innerHTML = "Trials run complete, click here to download Data";
                    downloadDataButton.setAttribute('style', "background-color: green; color:white;");
                }
            } else {
                params.SIM_CURR_TRIAL++;
            }
            rValue = true;
        }
        return rValue;
    }

    deathRoulette2(speciesMap) {
        let totalFitness;
        let speciesFitnessMap = new Map();
        let rouletteWheel = [];
        speciesMap.forEach((speciesList, speciesId) => {
            let speciesFitness;
            // Sum raw fitness for all members of this species
            speciesList.forEach(member => {
                speciesFitness += member.genome.rawFitness;
                rouletteWheel.push(speciesId);

            });
            // Maps speciesId to the species average fitness
            speciesFitnessMap.set(speciesId, Math.floor(speciesFitness / speciesList.length))
            totalFitness += speciesFitness;
        });
        rouletteWheel.sort((s1, s2) => speciesFitnessMap.get(s1) - speciesFitnessMap.get(s2))

        let rouletteResult = randomFloat(totalFitness)
        for(let i = rouletteWheel.length; i > 0; i--) {
            rouletteResult -= speciesFitnessMap.get(rouletteWheel[i])
            if (rouletteResult < 0) {
                // Removes the element in the opposite position of the list when the roulette is rolled
                // Very good performing fitnesses lead to a higher likelihood of lower performers to be rolled
                // Very poor performers result in a lower chance for the high performers to be rolled
                // Not necessarily ideal but it's a work in progress
                // TODO: consider replacing this functionality
                for(const element in speciesMap.get(rouletteWheel[rouletteWheel.length-i])) {
                    if(!element.removeFromWorld) {
                        element.removeFromWorld = true;
                        break;
                    }
                }
                // currently exits after 1 'kill', can adjust a counter to only break at certain count
                break;
            }
        }
        
    }

    //TODO: rewrite this so that it stops breaking everything
    deathRoulette(reprodFitMap, sumShared, speciesMap, hierarchy) {
        let rouletteOrder = [...reprodFitMap.keys()].sort();
        let ascendingFitSpecies = [...reprodFitMap.keys()].sort((s1, s2) => reprodFitMap.get(s1) - reprodFitMap.get(s2));
        let deathFitMap = new Map();
        for (let i = 0; i < ascendingFitSpecies.length; i++) {
            deathFitMap.set(ascendingFitSpecies[i], reprodFitMap.get(ascendingFitSpecies[ascendingFitSpecies.length - i - 1]));
        }
        console.log("sumshared in deathroulette for " + hierarchy + " is " + sumShared)

        let dead = hierarchy == 0 ? PopulationManager.NUM_PREY - this.countAlives()[0] : PopulationManager.NUM_PREDATOR - this.countAlives()[1]
        let numAgents = this.agentsAsList().length;
        for (let i = 0; i < Math.ceil(numAgents / 2) - dead; i++) { // death roulette -> kill the ceiling to ensure agent list is always even

            let killed = false;
            while (!killed) { // keep rolling the roulette wheel until someone dies
                console.log(sumShared)
                let rouletteResult = randomFloat(sumShared);
                let rouletteIndex = 0;
                let accumulator = 0;
                let flag = false;
                // console.log(rouletteOrder)
                while (!flag) {
                    let nextSpecies = rouletteOrder[rouletteIndex];
                    accumulator += deathFitMap.get(nextSpecies);
                    if (accumulator >= rouletteResult) { // we try to kill a parent... might not be successful
                        flag = true;
                        let killOptions = shuffleArray(speciesMap.get(nextSpecies));
                        let j = 0;
                        while (j < killOptions.length && !killed) {
                            let toKill = killOptions[j];
                            if (!toKill.removeFromWorld) {
                                killed = true;
                                toKill.removeFromWorld = true;
                            }
                            j++;
                        }
                    }
                    rouletteIndex++;
                }
            }
        }
    }

    crossover(reprodFitMap, sumShared, predReprodFitMap, predSumShared) {
        // CROSSOVER: randomly produce offspring between n pairs of remaining agents, reproduction roulette
        let alives = this.countAlives(); // if free range mode kills off everybody, we produce at least 1 new agent
        let preyDead = PopulationManager.NUM_PREY - alives[0];
        this.replacement(reprodFitMap, sumShared, preyDead, PopulationManager.PREY_SPECIES_MEMBERS, 0);
        if(params.coevolution) {
            this.replacement(predReprodFitMap, predSumShared, PopulationManager.NUM_PREDATOR - alives[1], PopulationManager.PREDATOR_SPECIES_MEMBERS, 1);
        }
    }

    replacement(reprodFitMap, sumShared, count, speciesMap, hierarchy) {
        let children = [];
        let rouletteOrder = [...reprodFitMap.keys()].sort();
        for (let i = 0; i < count; i++) {
            let rouletteResult = randomFloat(sumShared);
            let rouletteIndex = 0;
            let accumulator = 0;
            let flag = false;
            let parent1, parent2;
            while (!flag) {
                let nextSpecies = rouletteOrder[rouletteIndex];
                accumulator += reprodFitMap.get(nextSpecies);
                if (accumulator >= rouletteResult) {
                    flag = true;
                    let possibleParents = speciesMap.get(nextSpecies);
                    parent1 = possibleParents[randomInt(possibleParents.length)];
                    parent2 = possibleParents[randomInt(possibleParents.length)];
                }
                rouletteIndex++;
            }
            let childGenome = Genome.crossover(parent1.genome, parent2.genome);
            childGenome.mutate();
            let child = new Agent(this.game, params.CANVAS_SIZE / 2, params.CANVAS_SIZE / 2, childGenome, hierarchy);
            // if(params.coevolution) {
            //     child.foodHierarchyIndex = hierarchy;
            // }
            children.push(child);
        }
        this.registerChildAgents(children, speciesMap, hierarchy);
    }
};
