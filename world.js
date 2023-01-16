/**
 * Seperate world that the agents live in
 */

class World {
    constructor(game, worldId, speciesId) {
        let world = this.createWorldCanvas(worldId);
        Object.assign(this, {game, worldId, speciesId});
        this.agents = [];
        this.food = [];
        this.poison = [];
        this.home = new HomeBase(this.game, params.CANVAS_SIZE / 2, params.CANVAS_SIZE / 2);
        this.ctx = world.getContext("2d");
        this.canvas = world;
        this.display = new DataDisplay(this.game);
        this.walls = [];

        this.home.worldId = worldId;
        this.display.worldId = worldId;
    };

    update() {
        
    };

    isFoodGone() {
        for (let i = 0; i < this.food.length; i++) {
            if (!this.food[i].removeFromWorld) {
                return false;
            }
        }
        return true;
    };

    isAgentEnergyGone() {
        for (let i = 0; i < this.agents.length; i++) {
            if (this.agents[i].energy > Agent.DEATH_ENERGY_THRESH) {
                return false;
            }
        }
        return true;
    };

    cleanupFood(poison = false) {
        let foodList = poison ? this.poison : this.food;
        for (let i = foodList.length - 1; i >= 0; --i) { // remove eaten or dead food/poison
            if (foodList[i].removeFromWorld) {
                foodList.splice(i, 1);
            }
        }
    };

    checkFoodLevels(poison = false) { // periodic food/poison repopulation function
        this.cleanupFood(poison);
        this.spawnFood(poison, (poison ? params.POISON_AGENT_RATIO : params.FOOD_AGENT_RATIO) * this.agents.length - (poison ? this.poison.length : this.food.length));
    };

    getEntitiesInWorld(worldId, foodOnly = false, agentsOnly = false) {
        let members = this.worlds.get(worldId);

        if (foodOnly) {
            return members.food.concat(members.poison);
        } else if (agentsOnly) {
            return members.agents;
        } else {
            return members.food.concat(members.poison, members.agents);
        }
    };

    //Spawn agents
    spawnAgents() {
        PopulationManager.SPECIES_MEMBERS.set(PopulationManager.SPECIES_ID, []);
        PopulationManager.SPECIES_CREATED++;
        for (let i = 0; i < PopulationManager.NUM_AGENTS; i++) { // add agents
            let agent = new Agent(this.game, params.CANVAS_SIZE / 2, params.CANVAS_SIZE / 2);
            agent.speciesId = PopulationManager.SPECIES_ID;
            PopulationManager.SPECIES_MEMBERS.get(PopulationManager.SPECIES_ID).push(agent);
            this.agents.push(agent);
        }
    };

    spawnFood(poison = false, count = (poison ? params.POISON_AGENT_RATIO : params.FOOD_AGENT_RATIO) * this.agents.length) {
        let seedlings = [];
        let index = 0;
        for (let i = 0; i < count; i++) { // add food sources
            let pod = poison ? this.poisonPodLayout[index] : this.foodPodLayout[index];
            let loc = pod.genFoodPos();
            seedlings.push(new Food(this.game, loc.x, loc.y, poison, this.foodTracker));
            index = (index + 1) % (poison ? this.poisonPodLayout.length : this.foodPodLayout.length);
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

    countDeads() {
        let count = 0;
        this.agents.forEach(agent => {
            if (agent.removeFromWorld) {
                count++;
            }
        });
        return count;
    };

    countAlives(worldId = undefined) {
        let count = 0;
        this.agents.forEach(agent => {
            if (!agent.removeFromWorld) {
                count++;
            }
        });
        return count;
    };

    foodAsList(poison = false) {
        return poison ? this.poison : this.food;;
    };

    cleanupAgents() {
        let extincts = [];
        this.worlds.forEach((members, worldId) => {
            for (let i = members.agents.length - 1; i >= 0; --i) {
                if (members.agents[i].removeFromWorld) {
                    members.agents.splice(i, 1);
                }
            }
            if (members.agents.length === 0) {
                extincts.push(worldId);
            }
        });
        if (params.SPLIT_SPECIES) {
            extincts.forEach(speciesId => {
                this.removeWorld(speciesId);
            });
        }
    };

    /**
     * Add border to a particular world
     * @param {*} worldId The world id we want to implement border in
     */
    addBorderToWorld = () => {
        //Adding actual border
        let northWall = new Wall(this.game, this.worldId, 0, 0, 0, params.CANVAS_SIZE);
        let eastWall = new Wall(this.game, this.worldId, 0, params.CANVAS_SIZE, params.CANVAS_SIZE, params.CANVAS_SIZE);
        let southWall = new Wall(this.game, this.worldId, params.CANVAS_SIZE, 0, params.CANVAS_SIZE, params.CANVAS_SIZE);
        let westWall = new Wall(this.game, this.worldId, 0, 0, params.CANVAS_SIZE, 0);

        this.walls.push(northWall); 
        this.walls.push(eastWall); 
        this.walls.push(southWall); 
        this.walls.push(westWall); 
    }

    createWorldCanvas(worldId) {
        let canvas = document.createElement("canvas");
        canvas.id = `${worldId}`;
        canvas.width = params.CANVAS_SIZE;
        canvas.height = params.CANVAS_SIZE;
        canvas.style.border = "1px solid black";
        return canvas;
    };

    removeWorld() {
        this.home.removeFromWorld = true;
        this.food.forEach(food => food.removeFromWorld = true);
        this.poison.forEach(poison => poison.removeFromWorld = true);
        this.games.population.worlds.delete(this.worldId);
    };

    /**
     * Randomizing A edge of a box Walls in a particular world and clear the wall in this world
     * Randomizing zone is limit by two squares.
     * @param {*} world the world to spawn wall in
     * @param {*} n number of walls (Maximum is 4)
     * @param {*} spawningZoneStart the starting coordinate of the randomizing zone to spawn the walls 
     * @param {*} spawningZoneWidth the width of the randomizing zone to spawn the walls  
     */ 
    produceRandomBoxWalls(world, n, spawningZoneStart, spawningZoneWidth){
        let spawningCoordinateBegin = [
            {x: spawningZoneStart, y: spawningZoneStart},
            {x: params.CANVAS_SIZE - spawningZoneStart - spawningZoneWidth, y: spawningZoneStart},
            {x: spawningZoneStart, y: params.CANVAS_SIZE - spawningZoneStart - spawningZoneWidth},
            {x: spawningZoneStart, y: spawningZoneStart},
        ];

        let spawningCoordinateEnd = [
            {x: params.CANVAS_SIZE - spawningZoneStart, y: spawningZoneStart + spawningZoneWidth},
            {x: params.CANVAS_SIZE - spawningZoneStart, y: params.CANVAS_SIZE - spawningZoneStart},
            {x: params.CANVAS_SIZE - spawningZoneStart, y: params.CANVAS_SIZE - spawningZoneStart},
            {x: spawningZoneStart + spawningZoneStart, y:  params.CANVAS_SIZE - spawningZoneStart},
        ];

        //Clear the walls first
        world.walls = [];
        //Re added border walls
        this.addBorderToWorld();

        //Added the walls in
        let arr = shuffleArray([0, 1, 2, 3]);

        for (let i = 0; i < Math.max(0, (n % 4)); i++){
            let tmp = new Wall(this.game, world.worldId, spawningCoordinateBegin[arr[i]].x, spawningCoordinateBegin[arr[i]].y, spawningCoordinateEnd[arr[i]].x , spawningCoordinateEnd[arr[i]].y); 
            world.walls.push(tmp);  
        }
        
    }

    resetCanvases() {
        const tmp = [];
        this.worlds.forEach((val) => {
            tmp.push(val.canvas);
        });
        createSlideShow(tmp, 'canvas');
    };

  
};
