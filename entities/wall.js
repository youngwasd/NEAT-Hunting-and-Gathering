/**
 * The main class for Wall and Wall behaviors
 * 
 * @author Toan Nguyen and Gabe
 */
class Wall {

    /**
     * Creates a new Wall
     * 
     * @param {*} game the game engine
     * @param {*} xStart the x coordinate of start point of the wall
     * @param {*} yStart the y coordinate of start point of the wall
     * @param {*} xEnd the x coordinate of end point of the wall
     * @param {*} yEnd the y coordinate of end point of the wall
     */
    constructor(game, worldId, xStart, yStart, xEnd, yEnd) {
        Object.assign(this, { game, worldId, xStart, yStart, xEnd, yEnd });
        //slope is slope of the line
        this.slope = (yEnd - yStart) / (xEnd - xStart);
        //yInt is the y-intercept
        this.yInt = yStart - this.slope * xStart;
        //length of the wall
        this.len = Math.sqrt((yEnd - yStart) ** 2 + (xEnd - xStart) ** 2); //sqrt(x^2 + y^2)


        this.lineThickness = 1;
        this.strokeColor = "black";
        this.fillColor = "hsl(0, 0%, 0%)";
        this.dataHue = 30;
    };

    /**
     * Supplies this Agent's data hue that is visible by other Agent's in the sim
     * 
     * @returns this Agent's data hue
     */
    getDataHue() {
        return this.dataHue;
    };

    /**
     * Collision check for line segment (Limit by two end points) with a point
     * @param {*} x the x coordinate of the point we are checking
     * @param {*} y the y coordinate of the point we are checking
     * @return true if the point intersects the line segment, false otherwise
     */
    pointLineSegmentCollide = (x, y) => {
        //x or y is undefined
        if (!x || !y) {
            return false;
        }

        //
        let lowY = Math.min(this.yStart, this.yEnd);
        let highY = Math.max(this.yStart, this.yEnd);
        let lowX = Math.min(this.xStart, this.xEnd);
        let highX = Math.max(this.xStart, this.xEnd);
        if (y >= lowY && y <= highY && x >= lowX && x <= highX) {
            return true;
        }
        else return false;

        // //Check vertical line
        // if (x == this.xStart && x === this.xEnd) {
        //     return (y <= this.yEnd && y >= this.yStart);
        // }

        // //Checking to see if the Slope of Start -> Point = Slope of the line
        // let slopeSP = (y - this.yStart) / (x - this.xStart);

        // //Calculating length from start to Point
        // let lengthSP = Math.sqrt((y - this.yStart) ** 2 + (x - this.xStart) ** 2);
        // //Length from point to end
        // let lengthPE = Math.sqrt((y - this.yEnd) ** 2 + (x - this.xEnd) ** 2);

        // //The point lies in the segment if the line from start to point have the same slope as the wall's
        // // and the length from start to points + length from point to end = lenght of the entire wall 
        // return (this.slope == slopeSP && lengthSP + lengthPE - this.len <= 0.001);
    }

    /**
     * Collision check for line segment (Limit by two end points) & circle
     * @param {*} circle the circle being checked with this line
     * @return a list containing points of intersection, return empty if there is no intersection
     */
    lineSegmentCircleCollide = (circle) => {
        //Vertical line situation (Line with formula as x = -yInt)
        if (this.slope >= 999) {//There might be some calculation error causing a vertical line to have a big number for slope
            let x = circle.center.x;
            if (this.xEnd >= circle.center.x - circle.radius && this.xEnd <= circle.center.x + circle.radius) {
                let xRes = this.xEnd;
                let yRes = Math.sqrt(circle.radius ** 2 - (xRes - x) ** 2) + circle.center.y;//(radius^2 -(x - this.center.x)^2)
                if (this.pointLineSegmentCollide(xRes, yRes))
                    return [{ xRes, yRes }];
                else
                    return [];
            }

        }

        var a = 1 + this.slope * this.slope;

        var b = 2 * (this.slope * (this.yInt - circle.center.y) - circle.center.x);
        var c = circle.center.x * circle.center.x + (this.yInt - circle.center.y) * (this.yInt - circle.center.y) - circle.radius * circle.radius;

        var d = b * b - 4 * a * c;
        //console.log("Slope: " + this.slope + " " + this.yInt + " " + a + " " + b + " " + c + " " + d);
        if (d === 0) {
            //Return a point
            let xRes = (-b + Math.sqrt(d)) / (2 * a);
            let yRes = xRes * this.slope + this.yInt;

            if (this.pointLineSegmentCollide(xRes, yRes))
                return [{ xRes, yRes }];
            else
                return [];

        } else if (d > 0) {
            let res = [];
            let xRes = (-b - Math.sqrt(d)) / (2 * a);
            let yRes = xRes * this.slope + this.yInt;

            if (this.pointLineSegmentCollide(xRes, yRes))
                res.push({ xRes, yRes });

            xRes = (-b + Math.sqrt(d)) / (2 * a);
            yRes = xRes * this.slope + this.yInt;

            if (this.pointLineSegmentCollide(xRes, yRes))
                res.push({ xRes, yRes });

            return res;

        }

        return [];
    };

    /**
     * Check for collision of the wall with the agents and trigger collision handling
     * @param {*} collisionHandlingFunction the function to be called when collision happened
     * @return the number of agents colliding with wall
     */
    wallAgentCollisionHandling = (collisionHandlingFunction) => {
        //Collect all agents entity
        let entities = this.game.population.getEntitiesInWorld(this.worldId, false, true);

        let numberOfAgentsCollide = 0;

        //Going each agents and check collision for it
        entities.forEach(entity => {
            /** add all entities to the agentList that aren't ourselves, not dead*/
            if (entity !== this && !entity.removeFromWorld && this.lineSegmentCircleCollide(entity.BC).length > 0) {
                collisionHandlingFunction(entity);
                ++numberOfAgentsCollide;
            }
        });

        return numberOfAgentsCollide;
    }

    update() {
        this.wallAgentCollisionHandling((X) => {
            X.numberOfTickBumpingIntoWalls++;
            //console.log(X + " has bumped into walls " + X.numberOfTickBumpingIntoWalls +  " times");
            X.deactivateAgent();
            X.isActive = false;
        });
    };

    draw(ctx) {
        if (params.DISPLAY_SAME_WORLD){
            //this.game.population.worlds.get(0).value[1].ctx;
            ctx = this.game.population.worlds.get(0).ctx;
            let color = this.game.population.worlds.get(this.worldId).worldColor;
            ctx.fillStyle = `hsl(${color}, 100%, 50%)`;
            ctx.strokeStyle = `hsl(${color}, 100%, 50%)`;
        }
        else{
            ctx.strokeStyle = this.strokeColor;
            ctx.fillStyle = this.fillColor;
        }

        ctx.lineWidth = this.lineThickness;

        //Draw the line
        ctx.beginPath();
        ctx.moveTo(this.xStart, this.yStart);
        ctx.lineTo(this.xEnd, this.yEnd);
        ctx.closePath();
        

        ctx.fill();
        ctx.stroke();
    };
};

