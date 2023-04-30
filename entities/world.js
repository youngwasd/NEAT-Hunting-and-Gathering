/**
 * Seperate world that the agents live in
 */

class World {
    constructor(game, worldId, worldColor = 360) {
        let world = this.createWorldCanvas(worldId);
        Object.assign(this, { game, worldId, worldColor });
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
        this.speciesList = new Set();//Keep track of the list of species the world contains
        //Just for testing
        this.worldColor = PopulationManager.getNextAvailableWorldColor();

        //Add random box wall
        if (params.INNER_WALL) {
            this.produceRandomBoxWalls(2, params.CANVAS_SIZE / 8, params.CANVAS_SIZE / 10);
        }
        else {
            this.addBorderToWorld();
        }

        this.isActive = true;//Keep track of whether this world is still active
    };

    update() {
        //Do not update if world is not active
        if (!this.isActive) {
            return;
        }
        for (let i = 0; i < this.food.length; i++) {
            if (!this.food[i].removeFromWorld) {
                this.food[i].update();

            }
        }
        for (let i = 0; i < this.poison.length; i++) {
            if (!this.poison[i].removeFromWorld) {
                this.poison[i].update();
            }
        }
        for (let i = 0; i < this.agents.length; i++) {
            if (!this.agents[i].removeFromWorld) {
                this.agents[i].update();
            }
        }


        this.walls.forEach(wall => {
            wall.update(this.ctx)
        });
    };

    agentsAsList() {
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
     */
    addBorderToWorld = () => {
        if (params.NO_BORDER) {
            this.walls = [];
            return;
        }
        //Adding actual border
        let northWall = new Wall(this.game, this.worldId, 0, 0, 0, params.CANVAS_SIZE);
        let eastWall = new Wall(this.game, this.worldId, 0, params.CANVAS_SIZE, params.CANVAS_SIZE, params.CANVAS_SIZE);
        let southWall = new Wall(this.game, this.worldId, params.CANVAS_SIZE, 0, params.CANVAS_SIZE, params.CANVAS_SIZE);
        let westWall = new Wall(this.game, this.worldId, 0, 0, params.CANVAS_SIZE, 0);

        // let northWall = new Wall(this.game, this.worldId, 0, 0, 0, params.CANVAS_SIZE - 100);
        // let eastWall = new Wall(this.game, this.worldId, 0, params.CANVAS_SIZE - 100, params.CANVAS_SIZE  - 100, params.CANVAS_SIZE - 100);
        // let southWall = new Wall(this.game, this.worldId, params.CANVAS_SIZE - 100, 0, params.CANVAS_SIZE - 100, params.CANVAS_SIZE - 100);
        // let westWall = new Wall(this.game, this.worldId, 0, 0, params.CANVAS_SIZE - 100 , 0);

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
    produceRandomBoxWalls(n, spawningZoneStart, spawningZoneWidth) {
        // let spawningCoordinateBegin = [
        //     {x: spawningZoneStart, y: spawningZoneStart},
        //     {x: params.CANVAS_SIZE - spawningZoneStart - spawningZoneWidth, y: spawningZoneStart},
        //     {x: spawningZoneStart, y: params.CANVAS_SIZE - spawningZoneStart - spawningZoneWidth},
        //     {x: spawningZoneStart, y: spawningZoneStart},
        // ];

        // let spawningCoordinateEnd = [
        //     {x: params.CANVAS_SIZE - spawningZoneStart, y: spawningZoneStart + spawningZoneWidth},
        //     {x: params.CANVAS_SIZE - spawningZoneStart, y: params.CANVAS_SIZE - spawningZoneStart},
        //     {x: params.CANVAS_SIZE - spawningZoneStart, y: params.CANVAS_SIZE - spawningZoneStart},
        //     {x: spawningZoneStart + spawningZoneWidth, y:  params.CANVAS_SIZE - spawningZoneStart},
        // ];

        let spawningCoordinateBegin = [
            { x: spawningZoneStart, y: spawningZoneStart },
            { x: params.CANVAS_SIZE - spawningZoneStart, y: spawningZoneStart },
            { x: spawningZoneStart, y: params.CANVAS_SIZE - spawningZoneStart },
            { x: spawningZoneStart, y: spawningZoneStart },
        ];

        let spawningCoordinateEnd = [
            { x: params.CANVAS_SIZE - spawningZoneStart, y: spawningZoneStart },
            { x: params.CANVAS_SIZE - spawningZoneStart, y: params.CANVAS_SIZE - spawningZoneStart },
            { x: params.CANVAS_SIZE - spawningZoneStart, y: params.CANVAS_SIZE - spawningZoneStart },
            { x: spawningZoneStart, y: params.CANVAS_SIZE - spawningZoneStart },
        ];

        //Clear the walls first
        this.walls = [];
        //Re added border walls
        this.addBorderToWorld();

        //Added the walls in
        let arr = shuffleArray([0, 1, 2, 3]);

        for (let i = 0; i < Math.max(0, (n % 4)); i++) {
            let tmp = new Wall(this.game, this.worldId, spawningCoordinateBegin[arr[i]].x, spawningCoordinateBegin[arr[i]].y, spawningCoordinateEnd[arr[i]].x, spawningCoordinateEnd[arr[i]].y);
            this.walls.push(tmp);
        }

    }

    activate() {
        this.isActive = true;
    }

    deactivate() {
        this.isActive = false;
    }

    //Update food hierarchy of all agents in this world
    updateFoodHierarchy() {
        //Hunting mode is turned off
        if (params.HUNTING_MODE === "deactivated") {
            return;
        }

        //foodHierarchy of agent per world
        let foodHierarchy = false;
        let halfSize = params.CANVAS_SIZE / 2;
        let quarterSize = halfSize / 4;

        //Divide the map into 4 quadrants
        //Coordinate of the four quadrants
        // let startPosX = [quarterSize, quarterSize + halfSize, quarterSize, quarterSize + halfSize,];
        // let startPosY = [quarterSize, quarterSize + halfSize, quarterSize + halfSize, quarterSize];
        // let i = randomInt(4);
        // let spawnRadius = 100;

        let numberOfAgent = params.AGENT_PER_WORLD;
        if (params.AGENT_PER_WORLD === 0) {
            numberOfAgent = params.NUM_AGENTS;
        }

        let agentAssigned = 0;
        if (params.HUNTING_MODE === "hierarchy_spectrum") {
            foodHierarchy = {
                index: 0,
                step: (100 - 0) / params.AGENT_PER_WORLD,
            };
        }

        let spawnRadius = 300;
        let prevX = halfSize, prevY = halfSize;

        shuffleArray(this.agents).forEach(agent => {
            //Assign their food hiercarchy index based on how many agents per world
            //Spread the food hierarchy index accress the whole agent population
            if (params.HUNTING_MODE === "hierarchy_spectrum") {
                agent.foodHierarchyIndex = foodHierarchy.index;
               
                foodHierarchy.index += foodHierarchy.step;
            }
            else if (params.HUNTING_MODE === "hierarchy") {
                //Assign either predator or prey
                if (agentAssigned >= this.agents.length / 2) {
                    agent.foodHierarchyIndex = 50;
                }
                else {
                    agent.foodHierarchyIndex = 0;
                }
            }

            // //Update the agent position so they don't bump into each other when spawned
            // //Respawn at the opposite quadrant
            // agent.x = randomInt(spawnRadius * 2) - spawnRadius + startPosX[i];
            // agent.y = randomInt(spawnRadius * 2) - spawnRadius + startPosY[i];
            // i++;
            // i %= 4;
            let rx = randomInt(2) * (-2) + 1;
            let ry = randomInt(2) * (-2) + 1;
            let buffer = 100;
            agent.x = rx * (randomInt(spawnRadius * 2) - spawnRadius + buffer) + prevX;
            agent.y = ry * (randomInt(spawnRadius * 2) - spawnRadius + buffer) + prevY;

            if (isOutOfBound(agent.x, params.CANVAS_SIZE / 2, buffer)) {
                rx *= -1;
                agent.x = rx * (randomInt(spawnRadius * 2) - spawnRadius + buffer) + prevX;
            }
            if (isOutOfBound(params.CANVAS_SIZE / 2, agent.y , buffer)) {
                ry *= -1;
                agent.y = ry * (randomInt(spawnRadius * 2) - spawnRadius + buffer) + prevY;

            }

            prevX = agent.x;
            prevY = agent.y;

            agent.activateAgent();
            ++agentAssigned;
        });
    }

    /**
     * Reverses the food hierarchy by swapping the food hierarchy indecies such that everyone would have 
     * and index mirroring their current position on the hierarchy space.
     * 
     * Ex: starting with A = 0, B = 10, C = 20 would turn to A = 20, B = 10, C = 0
     */
    swapFoodHierarchies() {
        let agents = [...this.agents].sort((a, b) => a.foodHierarchyIndex - b.foodHierarchyIndex);
        let i = 0;
        let j = agents.length - 1;
        while (i < j) {
            [agents[i].foodHierarchyIndex, agents[j].foodHierarchyIndex] = [agents[j].foodHierarchyIndex, agents[i].foodHierarchyIndex];
            i++;
            j--;
        }
    }

    draw() {
        let ctx = this.ctx;
        // if (params.DISPLAY_SAME_WORLD) {
        //     ctx = this.game.population.worlds.entries().next().value[1].ctx;
        // }
        this.ctx.clearRect(0, 0, params.CANVAS_SIZE, params.CANVAS_SIZE);

        this.home.draw(ctx);
        this.food.forEach(food => {
            if (!food.removeFromWorld) {
                food.draw(ctx)
            }
        });
        this.poison.forEach(poison => {
            if (!poison.removeFromWorld) {
                poison.draw(ctx)
            }
        });
        this.agents.forEach(agent => {
            if (!agent.removeFromWorld) {
                agent.draw(ctx);
            }
        });
        this.display.draw(ctx);

        this.walls.forEach(wall => {
            wall.draw(ctx)
        });
    }


    resetCanvases() {
        const tmp = [];
        this.worlds.forEach((val) => {
            tmp.push(val.canvas);
        });
        createSlideShow(tmp, 'canvas');
    };

};
