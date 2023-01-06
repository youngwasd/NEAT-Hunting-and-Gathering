/**
 * The main class for Wall and Wall behaviors/lifecycles
 * 
 * @author Toan Nguyen 
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
        Object.assign(this, {game, worldId, xStart, yStart, xEnd, yEnd});
        //slope is slope of the line
        this.slope = (yEnd - yStart) / (xEnd - xStart);
        //yInt is the y-intercept
        this.yInt = yStart - this.slope * xStart;
        
        this.lineThickness = 1;
        this.strokeColor = "black";    
        this.fillColor = "hsl(0, 0%, 0%)";

    };
    /**
     * Collision check for line segment (Limit by two end points) & circle
     * @param {*} circle the circle being checked with this line
     * @return a list containing points of intersection, return empty if there is no intersection
     */
    lineSegmentCircleCollide(circle) {

        //Vertical line situation (Line with formula as x = -yInt)
        if (this.slope >= 999){//There might be some calculation error causing a vertical line to have a big number for slope
            let x = circle.center.x;
            if(this.xEnd >= circle.center.x - circle.radius && this.xEnd <= circle.center.x + circle.radius){
                console.log("Look like I hit a vertical wall");
                return [this.xEnd];
            }
        }

        var a = 1 + this.slope * this.slope;
        
        var b = 2 * (this.slope * (this.yInt - circle.center.y) - circle.center.x);
        var c = circle.center.x * circle.center.x + (this.yInt - circle.center.y) * (this.yInt - circle.center.y) - circle.radius * circle.radius;

        var d = b * b - 4 * a * c;
        //console.log("Slope: " + this.slope + " " + this.yInt + " " + a + " " + b + " " + c + " " + d);
        if (d === 0) {
            //Return a point
            let x_res = (-b + Math.sqrt(d)) / (2 * a);
            let y_res = this.yInt = this.yStart - this.slope * this.xStart;
            return [{x : x_res, y: y_res}];

        } else if (d > 0) {
            let x_res1 = (-b - Math.sqrt(d)) / (2 * a);
            let y_res1 = this.yInt = this.yStart - this.slope * this.xStart;

            let x_res2 = (-b + Math.sqrt(d)) / (2 * a);
            let y_res2 = this.yInt = this.yStart - this.slope * this.xStart;

            return [{x : x_res1, y: y_res1}, {x : x_res2, y: y_res2}];
        } 

        return [];
    };

    update() {
        let agentsList = [];
        //Collect all agents entity
        let entities = this.game.population.getEntitiesInWorld(this.worldId, false, true);
        
        //Going each agents and check collision for it
        entities.forEach(entity => {
            /** add all entities to the agentList that aren't ourselves, not dead*/
            if (entity !== this && !entity.removeFromWorld && this.lineSegmentCircleCollide(entity.BC).length > 0) {
                agentsList.push(entity);
                //Temporary kill agents if cross the wall
                entity.removeFromWorld = true;
                //console.log(entity.BC);
                
               console.log(entity + " is dead, goodbye cruel world!");
            }
        });



    };

    draw(ctx) {
        ctx.lineWidth = this.lineThickness;

        //Draw the line
        ctx.beginPath();
        ctx.moveTo(this.xStart, this.yStart);
        ctx.lineTo(this.xEnd, this.yEnd);
        
        ctx.strokeStyle = this.strokeColor;
        ctx.fillStyle = this.fillColor;

        ctx.fill();
        ctx.stroke();
    };
};

