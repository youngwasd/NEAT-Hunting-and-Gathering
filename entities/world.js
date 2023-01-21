/**
 * Seperate world that the agents live in
 */

class World {
    constructor(game, worldId, specieId = worldId) {
        let world = this.createWorldCanvas(worldId);
        Object.assign(this, {game, worldId, specieId});
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

        //Add random box wall
        if (params.INNER_WALL){
        this.produceRandomBoxWalls(2, params.CANVAS_SIZE / 8, params.CANVAS_SIZE / 10);    
        }
        else{
            this.addBorderToWorld();
        }
    };

    update() {
        
    };

    agentsAsList(){
        return this.agents;
    }

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

    countDeads() {
        let count = 0;
        this.agents.forEach(agent => {
            if (agent.removeFromWorld) {
                count++;
            }
        });
        return count;
    };

    countAlives() {
        let count = 0;
        this.agents.forEach(agent => {
            if (!agent.removeFromWorld) {
                count++;
            }
        });
        return count;
    };

    foodAsList(poison = false) {
        return poison ? this.poison : this.food;
    };

    cleanupAgents() {
        for (let i = this.agents.length - 1; i >= 0; --i) {
            if (this.agents[i].removeFromWorld) {
                this.agents.splice(i, 1);
            }
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
    };

    /**
     * Randomizing A edge of a box Walls in a particular world and clear the wall in this world
     * Randomizing zone is limit by two squares.
     * @param {*} n number of walls (Maximum is 4)
     * @param {*} spawningZoneStart the starting coordinate of the randomizing zone to spawn the walls 
     * @param {*} spawningZoneWidth the width of the randomizing zone to spawn the walls  
     */ 
    produceRandomBoxWalls(n, spawningZoneStart, spawningZoneWidth){
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
        this.walls = [];
        //Re added border walls
        this.addBorderToWorld();

        //Added the walls in
        let arr = shuffleArray([0, 1, 2, 3]);
        console.log(arr);
        for (let i = 0; i < Math.max(0, (n % 4)); i++){
            let tmp = new Wall(this.game, this.worldId, spawningCoordinateBegin[arr[i]].x, spawningCoordinateBegin[arr[i]].y, spawningCoordinateEnd[arr[i]].x , spawningCoordinateEnd[arr[i]].y); 
            this.walls.push(tmp);  
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
