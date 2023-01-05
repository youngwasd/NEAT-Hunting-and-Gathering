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
    constructor(game, xStart, yStart, xEnd, yEnd) {
        Object.assign(this, {game, xStart, yStart, xEnd, yEnd});
        this.lineThickness = 2;
        this.strokeColor = "black";    
        this.fillColor = "hsl(0, 0%, 0%)";

    };

    update() {};

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

