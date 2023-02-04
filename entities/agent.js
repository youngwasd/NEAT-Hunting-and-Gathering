/**
 * The main class for Agents and Agent behavior
 * 
 * @author Parker Rosengreen
 */
class Agent {

    /** The amount of energy at which an Agent will die */
    static DEATH_ENERGY_THRESH = 0;//-1000000;

    /** The amount of energy an Agent is given upon spawn */
    static START_ENERGY = 100;

    static BASE_DIAMETER = 15;

    static distForBiteReward = [
        {
            maxGen: 20,
            dist: 600,
        },
        /*{
            maxGen: 60,
            dist: 200
        },
        {
            maxGen: 100,
            dist: 100
        },
        {
            maxGen: 200,
            dist: 50
        },*/
        /*{
            maxGen: Infinity,
            dist: Agent.BASE_DIAMETER/2
        },*/
    ]

    /**
     * 
     * @param {*} game the game engine
     * @param {*} x the starting centered x position
     * @param {*} y the starting centered y position
     * @param {*} genome the Agent's genome (defaults to undefined if Agent is not an offspring of parent Agents)
     */
    constructor(game, x, y, genome = undefined) {
        Object.assign(this, { game, x, y });
        this.strokeColor = "black"; // the color of the Agent's circular outlining
        this.leftWheel = 0; // the "power" supplied to the Agent's left wheel (falls in the range -1 to 1 inclusive)
        this.rightWheel = 0; // the "power" supplied to the Agent's right wheel (falls in the range -1 to 1 inclusive)
        this.heading = randomInt(361) * Math.PI / 180; // the angle at which an Agent is traveling (fall between 0 to 2pi exclusive)
        this.genome = genome === undefined ? new Genome() : genome; // create a new Genome if none is supplied, otherwise perform an assignment
        this.neuralNet = new NeuralNet(this.genome); // create a new neural network corresponding to the previously assigned Genome
        this.resetEnergy(); // set the Agent's energy to the statically defined start energy
        this.updateDiameter(); // how wide the agent's circle is drawn
        this.wheelRadius = 1; // an agent is more or less structured like a Roomba vacuum robot, and this is the radius of one of its 2 wheels
        this.maxVelocity = 5; // a UNITLESS value which controls the movement speed of Agents in the sim
        this.resetCalorieCounts(); // resets the Agent's good and bad calories eaten
        this.age = 0; // all Agents start at age 0
        this.resetOrigin(); // assigns this Agent's origin point to its current position
        this.updateBoundingCircle(); // initialize the bounding circle

        this.tickCounter = 0;

        this.isOutOfBound = false;//Whether the agent is Out of Bound
        this.numberOfTickOutOfBounds = 0;//Total ticks the agent spent out of bounds
        this.numberOfTickBumpingIntoWalls = 0;//Total ticks "bumping" into walls
        this.visCol = []; //initialize the array of all vision collisions
        this.spotted = [];
        this.biting = false;
        this.biteTicks = 0;
        this.maxEatingCompletion = 0;
        this.totalOutputs = [0, 0, 0];

        this.worldId = null;
    };

    /** Assigns this Agent's fitness */
    assignFitness() {

        /**
         * Defines the fitness of an Agent using constant parameters inputted by the sim user
         * 
         * @returns this Agent's fitness
         */
        const fitnessFunct = () => {
            let totalRawFitness = this.caloriesEaten * params.FITNESS_CALORIES;

            /** Rewards the agent based on how close they were to getting calories 
             * It rewards a fraction of what they would've gotten from eating the food depending on how close they were to consumption
            */
            if (this.closestFood.cals > 0) {
                //Part 1: how close were they to the food?
                let fitnessFromCalDist = 2 / (1 + Math.E ** (this.closestFood.dist / 50));
                //Part 2: were they touching the food, and if so were they also biting?
                let fitnessFromPotCal = 0.2 * fitnessFromCalDist + 0.2 * this.touchingFood + 0.2 * (this.touchingFood && this.biting);
                //Part 3: how close were they to finishing off the foods tick counter?
                fitnessFromPotCal += 0.4 * this.maxEatingCompletion;
                //Part 4: punish them based on how fast they were going, or if they were dead
                fitnessFromPotCal /= this.energy > Agent.DEATH_ENERGY_THRESH ? this.speed + 1 : 10;

                totalRawFitness += this.closestFood.cals * params.FITNESS_POTENTIAL_CALORIES * fitnessFromPotCal;
                //console.log("fitness from potential calories: " + (0.5 * fitnessFromCalDist + 0.5 * this.maxEatingCompletion * fitnessFromCalDist));
                //console.log("Closest I got to eating was: " + this.maxEatingCompletion);
            }
            /**
             * decrease fitness depend on number of ticks agent spend out of bound
             */
            totalRawFitness += params.FITNESS_OUT_OF_BOUND * this.numberOfTickOutOfBounds;
            totalRawFitness += params.FITNESS_BUMPING_INTO_WALL * this.numberOfTickBumpingIntoWalls;
            totalRawFitness += this.biteTicks;
            return totalRawFitness;
        };

        const fitnessToCornerFunct = () => {
            let distFromLeft = Math.abs(this.BC.radius - this.x);
            let distFromTop = Math.abs(this.BC.radius - this.y);
            let distFromRight = Math.abs((params.CANVAS_SIZE - this.BC.radius) - this.x);
            let distFromBottom = Math.abs((params.CANVAS_SIZE - this.BC.radius) - this.y);
            let dist = Math.min(distFromBottom, distFromLeft, distFromRight, distFromTop);
            let rawFitness = 100 / (dist + this.speed + 0.5);
            console.log("fitness from moving to wall: " + rawFitness);
            rawFitness += params.FITNESS_OUT_OF_BOUND * this.numberOfTickOutOfBounds;
            return rawFitness;
        }

        this.genome.rawFitness = fitnessFunct();
    };

    /** Updates this Agent's bounding circle to reflect its current position */
    updateBoundingCircle() {
        this.BC = new BoundingCircle(this.x, this.y, this.diameter / 2);
    };

    /**
     * Supplies this Agent's data hue that is visible by other Agent's in the sim
     * 
     * @returns this Agent's data hue
     */
    getDataHue() {
        return PopulationManager.SPECIES_SENSOR_COLORS.get(this.speciesId);
    };

    /**
     * Suppplies this Agent's visual hue that is used solely for visual distinction in the sim display.
     * This value is NOT used by Agents as input!
     * 
     * @returns this Agent's display hue
     */
    getDisplayHue() {
        return PopulationManager.SPECIES_COLORS.get(this.speciesId);
    };
    /**
     * Finds the shortest distance from this agent to a source of food (only food.js atm)
     * @param {*} sortedEntities this method assumes the entities are sorted by distance
     */
    getShortestDistToFood(sortedEntities) {
        for (let i = 0; i < sortedEntities.length; i++) {
            if (sortedEntities[i] instanceof Food && sortedEntities[i].phase < sortedEntities[i].lifecycle_phases.dead) {
                return { cals: sortedEntities[i].getCalories(), dist: distance(this.BC.center, sortedEntities[i].BC.center) };
            }
        }
        return { cals: 0, dist: Infinity };
    }

    updateFitnessBiteReward() {
        let distForBiteReward = Agent.distForBiteReward;
        let index = -1;
        for (let i = 0; i < distForBiteReward.length; i++) {
            if (PopulationManager.GEN_NUM < distForBiteReward[i].maxGen) {
                index = i;
                break;
            }
        }
        if (index >= 0) {
            if (this.closestFood.dist <= distForBiteReward[index].dist) {
                this.biteTicks++;
            } else if (index >= 2 && this.closestFood.dist > distForBiteReward[index - 2].dist) {
                //this.biteTicks--;
            }
        }

    }

    /** Updates this Agent's origin (initial position) to its current position in the sim */
    resetOrigin() {
        this.origin = { x: this.x, y: this.y };
    };

    /** Moves this Agent to the center of its world (the middle of the canvas) */
    moveToWorldCenter() {
        this.x = params.CANVAS_SIZE / 2;
        this.y = params.CANVAS_SIZE / 2;
    };

    /**  Resets this Agent's energy to the predefined starting energy for Agents */
    resetEnergy() {
        this.energy = Agent.START_ENERGY;
    };

    /** Resets the good and bad calories eaten by this Agent to 0 */
    resetCalorieCounts() {
        this.caloriesEaten = 0;
        this.badCaloriesEaten = 0;
    };

    /** Resets counters for the numbers of tick out of bound and bumping into walls */
    resetCounters() {
        this.numberOfTickBumpingIntoWalls = 0;
        this.numberOfTickOutOfBounds = 0;
        this.totalOutputs = [0, 0, 0];
    }

    /**
     * Indicates whether this Agent is within the boundaries of its world (is visible on the canvas)
     * 
     * @returns true if within the world bounds, false otherwise
     */
    isInWorld() {
        return this.x >= 0 && this.x < params.CANVAS_SIZE && this.y >= 0 && this.y < params.CANVAS_SIZE;
    };

    getEyePos() {
        return { x: this.BC.center.x + (this.diameter + 1) / 2 * Math.cos(this.heading), y: this.BC.center.y + (this.diameter + 1) / 2 * Math.sin(this.heading) };
    }

    /**
     * Function used for getting the relative angle between an Agent and a neighboring entity.
     * The relative position angle is always between 0 and pi inclusive, so the mininum of
     * the left and right relative angles is always returned. Relative left angles
     * fall between -pi and 0 inclusive, while relative right angles fall between 0 and pi inclusive.
     * 
     * @param {*} vector 
     * @returns 
     */
    getRelativePositionAngle(vector) {
        let vectAngle = Math.atan2(vector.y, vector.x);
        if (vectAngle < 0) {
            vectAngle = 2 * Math.PI + vectAngle; // convert to a clock wise angle 0 <= a < 2pi
        }
        let relLeft = AgentInputUtil.relativeLeft(this.heading, vectAngle);
        let relRight = AgentInputUtil.relativeRight(this.heading, vectAngle);
        return Math.abs(relLeft) < Math.abs(relRight) ? relLeft : relRight;
    };

    //Make the energy = energy threshold
    deactivateAgent() {
        this.energy = Agent.DEATH_ENERGY_THRESH;
    }

    /** Updates this Agent for the current tick */
    update() {
        let oldPos = { x: this.x, y: this.y }; // note where we are before moving

        let spottedNeighbors = [];

        let input = []; // the input to the neural network

        input.push(1); // bias node always = 1

        /**
         * if we have split species on, then we only get entities in the world corresponding to our species id, otherwise all entities
         * are guaranteed to be in world 0. If AGENT_NEIGHBORS is off, then we only retrieve food
         */
        let entities = this.game.population.getEntitiesInWorld(params.SPLIT_SPECIES ? this.worldId : 0, !params.AGENT_NEIGHBORS);


        entities.forEach(entity => {
            /** add all entities to our spotted neighbors that aren't ourselves, not dead, and are within our vision radius */
            if (entity !== this && !entity.removeFromWorld && distance(entity.BC.center, this.BC.center) <= params.AGENT_VISION_RADIUS) {
                spottedNeighbors.push(entity);
            }
        });

        /** sorts the spotted neighbors in increasing order of proxomity */
        spottedNeighbors.sort((entity1, entity2) => distance(entity1.BC.center, this.BC.center) - distance(entity2.BC.center, this.BC.center));

        //Determine closest food for fitness function
        this.closestFood = this.getShortestDistToFood(spottedNeighbors);

        if (params.AGENT_VISION_IS_CONE) {
            this.coneVision(input);
        } else {

            // add input for the neighbors we have spotted, up to AGENT_NEIGHBOR_COUNT
            for (let i = 0; i < Math.min(spottedNeighbors.length, params.AGENT_NEIGHBOR_COUNT); i++) {
                let neighbor = spottedNeighbors[i];
                input.push(AgentInputUtil.normalizeHue(neighbor.getDataHue())); // the data hue
                input.push(AgentInputUtil.normalizeAngle(this.getRelativePositionAngle({ x: neighbor.x - this.x, y: neighbor.y - this.y }))); // normalized relative position angle
                input.push(AgentInputUtil.normalizeDistance(distance(neighbor.BC.center, this.BC.center))); // normalized distance from the entity
            }
            for (let i = input.length; i < Genome.DEFAULT_INPUTS - 1; i++) { // fill all unused input nodes with 0's
                input.push(0);
            }
        }

        let normEnergy = this.energy / Agent.START_ENERGY;
        input.push(2 / (1 + Math.E ** (4 * normEnergy)));

        if (this.energy <= Agent.DEATH_ENERGY_THRESH) { // if we are dead, we don't move
            this.leftWheel = 0;
            this.rightWheel = 0;
        } else { // if we are still alive, set our wheel power values to the output of our neural net
            let output = this.neuralNet.processInput(input);
            this.leftWheel = output[0];
            this.rightWheel = output[1];
            this.biting = Math.abs(output[2]) > 0.5;
            this.totalOutputs[0] += this.leftWheel;
            this.totalOutputs[1] += this.rightWheel;
            this.totalOutputs[2] += output[2];

            //Gathering the current generation data
            if (params.TICK_TO_UPDATE_CURRENT_GEN_DATA != 0){
                let slot = PopulationManager.CURRENT_GEN_DATA_GATHERING_SLOT;
                this.game.population.currentLeftWheelHist.data[slot][determineBucket(output[0], -1, 1)]++;
                this.game.population.currentRightWheelHist.data[slot][determineBucket(output[1], -1, 1)]++;
                this.game.population.currentBiteHist.data[slot][determineBucket(output[2], -1, 1)]++;
            }
        }
        /**update reward for biting near the food */
        if (this.biting) this.updateFitnessBiteReward();

        /** This is the physics behind how our wheel's power values affect our position and heading */
        let dh = this.wheelRadius / this.diameter * this.maxVelocity * (this.rightWheel - this.leftWheel);
        let dx = (this.wheelRadius / 2) * this.maxVelocity * (this.rightWheel + this.leftWheel) * Math.cos(this.heading);
        let dy = (this.wheelRadius / 2) * this.maxVelocity * (this.rightWheel + this.leftWheel) * Math.sin(this.heading);
        this.x += dx;
        this.y += dy;
        this.heading += dh;

        this.speed = Math.sqrt(dx ** 2 + dy ** 2);

        /** Make sure our new heading is between 0 and 2pi exclusive */
        if (this.heading < 0) {
            this.heading += 2 * Math.PI;
        } else if (this.heading >= 2 * Math.PI) {
            this.heading -= 2 * Math.PI;
        }

        //METABOLISM: Defined by the power of the wheels
        this.energy -= Math.abs(this.leftWheel) * Math.abs(this.rightWheel) / 3;
        this.energy -= this.biting ? 0.1 : 0;
        this.energy -= 0.1; // this is a baseline metabolism that is independent of Agent physical activity

        /** Update our diameter and BC to reflect our current position */
        this.updateDiameter();
        this.updateBoundingCircle();

        /** If we are still alive, and we just bit loop through spotted food and eat those we are colliding with */
        if (this.energy > Agent.DEATH_ENERGY_THRESH) {
            let foundFood = false;
            spottedNeighbors.forEach(entity => {
                if (entity instanceof Food && this.BC.collide(entity.BC) && !foundFood) {
                    if (this.biting) {
                        let consOut = entity.consume();
                        let cals = consOut.calories;
                        let completion = consOut.completion;
                        if (cals < 0) {
                            this.badCaloriesEaten += Math.abs(cals);
                        } else {
                            this.caloriesEaten += cals;
                        }
                        this.energy += cals;

                        this.eatingCompletion = completion;
                        this.maxEatingCompletion = this.maxEatingCompletion < this.eatingCompletion ? this.eatingCompletion : this.maxEatingCompletion;
                    }
                    foundFood = true;
                }
            });
            this.touchingFood = foundFood;
            /** Our energy may have changed, so update our diameter and BC once again */
            this.updateDiameter();
            this.updateBoundingCircle();
        }

        //Check out of bound here
        //if (this.x + this.diameter < 0 || this.x - this.diameter > params.CANVAS_SIZE || this.y + this.diameter < 0 || this.y - this.diameter > params.CANVAS_SIZE){//Accounting for the agent's size and 2 layers punishments (walls + out of bound)
        if (this.x < 0 || this.x > params.CANVAS_SIZE || this.y < 0 || this.y > params.CANVAS_SIZE) {//Old out of bound condition
            this.isOutOfBound = true;
            ++this.numberOfTickOutOfBounds;

            //Toan Deactivate the agent when they go out of bound
            this.deactivateAgent();

        }
        else {
            this.isOutOfBound = false;
        }
        this.tickCounter++;
    };

    /** Updates this Agent's diameter in alignment with the DYNAMIC_AGENT_SIZING sim parameter */
    updateDiameter() {

        if (params.DYNAMIC_AGENT_SIZING) { // Agents are able to grow up to 150% their smallest size in proportion to their energy
            const min_food_cal = 50;
            const max_food_cal = 150;
            let addOn = 0; // the amount we add onto the base diameter

            if (this.energy > Agent.DEATH_ENERGY_THRESH) { // if alive, scale by how well this Agent has eaten its allotted food
                addOn = Agent.BASE_DIAMETER / 2 * Math.min(1, this.energy / (params.FOOD_AGENT_RATIO * max_food_cal));
            }
            this.diameter = Agent.BASE_DIAMETER + addOn;
        } else {
            this.diameter = Agent.BASE_DIAMETER;
        }
    };

    /**
     * @param {*} line the line representing the ray
     * @param {*} circle the BC of the entity being checked for collision
     * @returns 
     */
    visionRayCollision(line, entity, eyes) {
        var circle = entity.BC;
        var slope = line.slope;

        var yInt = line.yInt;
        var a = 1 + slope ** 2;
        var b = 2 * (slope * (yInt - circle.center.y) - circle.center.x);
        var c = circle.center.x ** 2 + (yInt - circle.center.y) ** 2 - circle.radius ** 2;

        var d = b * b - 4 * a * c;
        let x = null;
        if (d === 0) {
            x = -b / (2 * a);
        } else if (d > 0) {
            let xVals = { x1: (-b + Math.sqrt(d)) / (2 * a), x2: (-b - Math.sqrt(d)) / (2 * a) };
            let x1Dist = Math.abs(eyes.x - xVals.x1); let x2Dist = Math.abs(eyes.x - xVals.x2);
            if (x1Dist <= x2Dist) {
                x = xVals.x1;
            } else {
                x = xVals.x2;
            }
        }
        if (x != null) {
            let y = x * slope + yInt;
            return { y: y, x: x };
        } else {
            return { y: Infinity, x: Infinity };
        }
    }

    visionRayWallCollision(line, wall) {
        if (line.slope === wall.slope) return false;
        if (wall.slope === Infinity) return { x: wall.xEnd, y: line.slope * wall.xEnd + line.yInt };

        var intersect = {};
        intersect.x = (wall.yInt - line.yInt) / (line.slope - wall.slope);
        intersect.y = line.slope * intersect.x + line.yInt;

        return intersect;
    }

    coneVision(input) {
        const rays = params.AGENT_VISION_RAYS - 1;
        const angle = params.AGENT_VISION_ANGLE * Math.PI / 180;
        const angleBetw = angle / rays;

        let currAngle = this.heading - angle / 2;

        let eyes = this.getEyePos();

        this.spotted = [];
        this.visCol = [];

        let entities = this.game.population.getEntitiesInWorld(params.SPLIT_SPECIES ? this.worldId : 0, !params.AGENT_NEIGHBORS);
        let walls = this.game.population.worlds.get(params.SPLIT_SPECIES ? this.worldId : 0).walls;
        for (let i = 0; i <= rays; i++) {

            while (currAngle < 0) {
                currAngle += Math.PI * 2;
            }
            while (currAngle > 2 * Math.PI) {
                currAngle -= Math.PI * 2;
            }

            const line = {
                slope: Math.tan(currAngle),
                yInt: eyes.y - eyes.x * Math.tan(currAngle)
            }
            let minDist = Infinity;
            let hueOfMinDist = 0;
            let closestPoint = null;

            let inRightHalf = currAngle <= Math.PI / 2 || currAngle > Math.PI * 3 / 2;

            //let inTopHalf = currAngle >= 0 && currAngle < Math.PI;
            //Check for wall collisions
            walls.forEach(wall => {
                let colVals = this.visionRayWallCollision(line, wall);
                let lowY = Math.min(wall.yStart, wall.yEnd);
                let highY = Math.max(wall.yStart, wall.yEnd);
                let lowX = Math.min(wall.xStart, wall.xEnd);
                let highX = Math.max(wall.xStart, wall.xEnd);
                const onSeg = (colVals.y > lowY || eqThrsh(colVals.y, lowY))
                    && (colVals.y < highY || eqThrsh(colVals.y, highY))
                    && (colVals.x > lowX || eqThrsh(colVals.x, lowX))
                    && (colVals.x <= highX || eqThrsh(colVals.x, highX));
                if (onSeg) {
                    let wallDist = distance(eyes, colVals);
                    if (wallDist < minDist && (inRightHalf === colVals.x >= eyes.x)) {
                        minDist = wallDist;
                        hueOfMinDist = wall.getDataHue();//tempory value to change
                        closestPoint = colVals;
                    }
                }
            });

            entities.forEach(entity => {
                if ((inRightHalf == entity.x >= eyes.x) && !entity.removeFromWorld && entity != this) {
                    let newSpot = this.visionRayCollision(line, entity, eyes);
                    let newDist = distance(eyes, newSpot);
                    if (newDist < minDist) {
                        minDist = newDist;
                        hueOfMinDist = entity.getDataHue();
                        closestPoint = newSpot;
                    }
                }
            });
            if (closestPoint != null) this.visCol.push(closestPoint);
            let spotVals = { dist: minDist, angle: currAngle };
            this.spotted.push(spotVals);

            //console.log("minDist: " + minDist);
            //Hard coded 200 value was hand tweaked, and not analytically determined
            let distInput = 2 / (1 + Math.E ** (minDist / 150));//minDist >= params.CANVAS_SIZE ? 0 : 360 - 360 * minDist / params.CANVAS_SIZE;
            //console.log("distInput: " + distInput);
            input.push(distInput);
            //console.log("hueOfMinDist: " + hueOfMinDist);
            input.push((hueOfMinDist) / 360);
            currAngle += angleBetw;
        }
    }
    /**
     * Draws this agent on its world canvas
     * 
     * @param {*} ctx the canvas context
     */
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.diameter / 2, 0, 2 * Math.PI);
        ctx.strokeStyle = this.strokeColor;
        ctx.fillStyle = `hsl(${this.getDisplayHue()}, ${this.energy > Agent.DEATH_ENERGY_THRESH ? '100' : '33'}%, 50%)`;
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
        ctx.closePath();

        ctx.beginPath();
        ctx.lineWidth = this.biting ? 10 : 2;//width for pointer line is thicker if biting
        ctx.moveTo(this.BC.center.x + this.diameter / 2 * Math.cos(this.heading), this.BC.center.y + this.diameter / 2 * Math.sin(this.heading));
        ctx.lineTo(this.BC.center.x + this.diameter * Math.cos(this.heading), this.BC.center.y + this.diameter * Math.sin(this.heading));
        ctx.stroke();
        ctx.closePath();

        ctx.lineWidth = 2;
        //Draw cone vision
        if (params.AGENT_VISION_IS_CONE && params.AGENT_VISION_DRAW_CONE && Array.isArray(this.spotted)) {
            this.drawVFinal(ctx);
            this.drawVCol(ctx);
        } else if (!Array.isArray(this.spotted)) {
            console.error("this.spotted is not an array...");
        }
    };

    drawVCol(ctx) {
        ctx.strokeStyle = "Red";
        ctx.linewidth = 2;
        for (let i = 0; i < this.visCol.length; i++) {
            ctx.beginPath();
            ctx.arc(this.visCol[i].x, this.visCol[i].y, 3, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();
        }
    }
    drawVFinal(ctx) {
        let eyes = this.getEyePos();
        ctx.strokeStyle = "Red";
        ctx.linewidth = 2;
        for (let i = 0; i < this.spotted.length; i++) {
            let angle = this.spotted[i].angle;
            let dist = this.spotted[i].dist == Infinity ? 9999 : this.spotted[i].dist;
            ctx.beginPath();
            ctx.moveTo(eyes.x, eyes.y);
            ctx.lineTo(eyes.x + (Math.cos(angle)) * dist, eyes.y + (Math.sin(angle)) * dist);
            ctx.stroke();
            ctx.closePath();
        }
    }
};
