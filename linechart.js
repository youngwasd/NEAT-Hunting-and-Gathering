/**
 *  Line chart used for illustration
 *  @author Toan Nguyen
 */
class Linechart {
    /**
     *
     * @param {*} x starting x position to draw the chart on Canvas
     * @param {*} y starting y position to draw the chart on Canvas
     * @param {*} width Width of the chart
     * @param {*} height Height of the chart
     * @param {*} data is a 1 dimensional array with each entry is a set of data. 
     * Each entry has to be a two dimensional array [][2]; 
     * Example: data = [[[6, 10],[7, 20]], [[1, 2],[2, 20]]]
     * @param {*} title title of the chart
     * @param {*} labelX Label for the x axis 
     * @param {*} labelY Label for the y axis 
     */
    constructor(x, y, width, height, data = [], title = "", labelX = "", labelY = "") {
        Object.assign(this, { x, y, width, height, title, labelX, labelY });
        this.updateCoordinate(x, y);
        this.maxValueX = -Infinity;
        this.maxValueY = -Infinity;
        this.minValueY = Infinity;
        this.minValueX = Infinity;
        this.maxDataLength = 0;
        this.data = [];
        this.addData(data);


    }

    reset() {
        this.data = [];
    }

    //Update coordinate to draw on Canvas
    updateCoordinate(x, y) {
        this.top = y + this.height;
        this.right = x + this.width;
        this.left = x;
        this.bottom = y;
    }

    //Add another data to the existing data list
    addData(newData) {
        if (!newData) {
            console.error("Empty Data, Adding Aborted.");
            return;
        }
        // console.log(newData);
        //Adding new data in to ensure there is always x and y values for each entry
        let dataToBeAdded = [];
        let xMax = -Infinity;
        let yMax = -Infinity;
        let xMin = Infinity;
        let yMin = Infinity;
        this.maxDataLength = Math.max(this.maxDataLength, newData.length);

        for (let i = 0; i < newData.length; i++) {
            let newEntry = newData[i];
            if (!(newEntry instanceof Array)) {
                newEntry = [newEntry];
            }
            if (newEntry.length == 1) {
                newEntry.push(newEntry[0]);
                newEntry[0] = i;
            }

            dataToBeAdded.push([newEntry[0], newEntry[1]]);
            xMax = Math.max(newEntry[0], xMax);
            yMax = Math.max(newEntry[1], yMax);
            xMin = Math.min(newEntry[0], xMin);
            yMin = Math.min(newEntry[1], yMin);
        }

        this.data.push(dataToBeAdded);
        this.maxValueX = xMax;
        this.maxValueY = yMax;
        this.minValueX = xMin;
        this.minValueY = yMin;
        this.updateStat();

    }

    updateStat() {
        this.startX = this.left + 35;
        this.endX = this.right - 25;
        this.startY = this.bottom + 100;
        this.endY = this.top + 6;

        //Set the drawing a little bit back
        if (String(this.maxValueY).length > 3) {
            this.startX = this.left + 45;

            if (String(this.maxValueY).length > 5) {
                this.startX = this.left + 50;
            }

        }

        this.actualStepValueX = Math.max(this.maxDataLength / (this.maxValueX - this.minValueX), 1);
        if (!this.actualStepValueX) {
            this.actualStepValueX = 1;
        }
        //this.actualStepValueY = (this.maxValueY - this.minValueY) / (this.maxValueY - this.minValueY);
        this.coordinateStepValueX = (this.endX - this.startX) / (this.maxValueX - this.minValueX);

        if (!this.coordinateStepValueX || this.coordinateStepValueX === Infinity) {
            this.coordinateStepValueX = 1;
        }
        this.coordinateStepValueY = (this.endY - this.startY) / (this.maxValueY - this.minValueY);

        if (!this.coordinateStepValueY || this.coordinateStepValueY === Infinity) {
            this.coordinateStepValueY = 1;
        }
    }

    replaceData(index = 0, newData = []) {
        if ((index < 0 || index > this.data.length)) {
            //Stop adding if newData is invalid
            console.error("Invalid Data Format, Adding Aborted.");
            return;
        }
        let oldData = this.data[index];
        this.data[index] = [];
        for (let i = 0; i < newData.length; i++) {
            if (!this.addEntry(index, newData[i])) {
                console.error("Invalid Data Format, Adding Aborted.");
                this.data[index] = oldData;
                return null;
            }
        }

        return true;

    }

    //Add a new single entry to existing data
    addEntry(newEntry = [], index = 0) {

        if ((index < 0 || index > this.data.length)) {
            //Stop adding if newEntry is invalid
            console.error("Invalid Entry Format, Adding Aborted.");
            return null;
        }
        if (!(newEntry instanceof Array)) {
            newEntry = [newEntry];
        }
        if (newEntry.length == 1) {
            newEntry.push(newEntry[0]);
            newEntry[0] = this.data[index].length;
        }


        if (index == this.data.length) {
            this.data.push([]);
        }
        this.data[index].push(newEntry);
        this.maxValueX = Math.max(newEntry[0], this.maxValueX);
        this.maxValueY = Math.max(newEntry[1], this.maxValueY);

        this.minValueX = Math.min(newEntry[0], this.minValueX);
        this.minValueY = Math.min(newEntry[1], this.minValueY);

        this.updateStat();
        this.maxDataLength = Math.max(this.maxDataLength, this.data[index].length);

        // console.log(startX, endX);
        // console.log(startY, endY);
        // console.log("Step: ", stepValueX, stepValueY);
        // console.log("X: ",this.minValueX, this.maxValueX, this.data.length);
        // console.log("Y: ",this.minValueY, this.maxValueY, this.data.length);
        return true;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.updateCoordinate(this.x, this.y);
        this.updateStat();

    }

    update() {

    }


    drawChartText(ctx, text, x = this.x, y = this.y, fontsize = parseInt(this.width / 50), color = "orange", align = "center") {
        ctx.beginPath();
        let tmpStyle = ctx.fillStyle;
        ctx.fillStyle = color;
        ctx.font = fontsize + "px sans-serif";
        ctx.textAlign = align;
        ctx.fillText(text, x, y);
        ctx.textAlign = "left";
        ctx.fillStyle = tmpStyle;
        ctx.fill();
        ctx.closePath();
    }

    drawDottedHorizontalLine(ctx, x1, x2, yy) {
        let tempSS = ctx.strokeStyle;
        ctx.strokeStyle = "green";//`hsl(297, 2%, 50%)`;//Light green
        ctx.setLineDash([1, 12]);
        ctx.beginPath();
        ctx.moveTo(x1, yy);
        ctx.lineTo(x2, yy);
        ctx.stroke();
        ctx.closePath();
        ctx.setLineDash([]);
        ctx.strokeStyle = tempSS;
    }

    checkRange(val, m, buffer) {
        let arr = m.filter((v) => {
            //console.log(v, Math.abs(v - val) <= buffer );
            return (Math.abs(v - val) <= buffer)
        });
        return arr.length === 0;
    }

    draw(ctx) {

        ctx.clearRect(this.left, this.bottom, this.right, this.top);
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.rect(this.left, this.bottom, this.right, this.top);
        ctx.stroke();
        ctx.closePath();

        let stepCoorX = (this.endX - this.startX) / Math.min(20, this.maxDataLength);
        let stepCoorY = (this.endY - this.startY) / Math.min(26, this.maxDataLength);

        //Draw the label
        this.drawChartText(ctx, this.title, (this.left + this.right) / 2, this.bottom + this.startY / 4, this.height / 15);//Title
        this.drawChartText(ctx, this.labelX, (this.left + this.right) / 2, this.top + 40, this.height / 25, "black");//X asix title
        this.drawChartText(ctx, this.labelY, this.left + 10, this.bottom + this.startY / 2, this.height / 25, "black", "left");//Y axis title

        //Draw the axis
        //Y axis
        ctx.beginPath();
        ctx.strokeStyle = "black";
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.startX, this.endY);
        //X axis
        ctx.moveTo(this.startX, this.endY);
        ctx.lineTo(this.endX, this.endY);

        ctx.stroke();
        ctx.closePath();


        //Draw reference line 
        //Set light grey color for reference lines  
        let diffY = this.maxValueY - this.minValueY;
        let stepValueY = (this.maxValueY - this.minValueY) / Math.min(26, this.maxDataLength);
        let stepValueX = (this.maxValueX - this.minValueX) / Math.min(20, this.maxDataLength);





        let fontSizeY = 12;
        //Set the font size for x
        if (String(this.maxValueY).length > 3) {
            fontSizeY = 10;

            if (String(this.maxValueY).length > 5) {
                fontSizeY = 9;
            }

        }

        let fontSizeX = 12;
        //Set the font size for x
        if (String(this.maxValueX).length > 3) {
            fontSizeX = 10;
            if (String(this.maxValueX).length > 6) {
                fontSizeX = 8;
            }
        }

        //Set up the indexes and reference line
        // for (let yy = this.endY, valY = this.minValueY; yy > this.startY - 1; yy -= stepCoorY, valY += stepValueY) {
        //     if (yy != this.endY) {
        // ctx.beginPath();
        // ctx.moveTo(this.startX, yy);
        // ctx.lineTo(this.endX, yy);
        // ctx.stroke();
        // ctx.closePath();

        //     }
        //     this.drawChartText(ctx, parseFloat(valY.toFixed(2)), this.left + 20, yy, fontSizeY, "black");//Draw the values

        // }


        //console.log(this.minValueX, this.maxValueX, this.minValueY, this.maxValueY, stepValueX, stepCoorX);

        // for (let xx = this.startX, valX = this.minValueX; xx <= this.endX; xx += stepCoorX, valX += stepValueX) {
        //     this.drawChartText(ctx, Math.round(valX, 1), xx, this.endY + 15, fontSizeX, "black");
        // }

        ctx.stroke();

        ctx.closePath();

        //Draw the points
        let pointColor = 200;
        let lineColor = 300;
        let drawListY = [];
        let drawListX = [];
        for (let k = 0; k < this.data.length; k++) {
            let prevX = 0;
            let prevY = 0;

            let stepToHighlight = Math.max(Math.floor(this.data[k].length / 20), 1);
            //console.log(stepToHighlight);
            let stepY = 0;

            for (let i = 0; i < this.data[k].length; i++) {
                let valX = this.data[k][i][0];
                let valY = this.data[k][i][1];
                let x = (valX - this.minValueX) * this.coordinateStepValueX + this.startX;
                let y = this.endY - (valY - this.minValueY) * this.coordinateStepValueY;//+ this.startY;

                if ((this.maxDataLength === this.data[k].length) && i % stepToHighlight === 0) {
                    if (this.checkRange(y, drawListY, fontSizeY)) {
                        this.drawChartText(ctx, parseFloat(valY.toFixed(2)), this.left + 20, y, fontSizeY, "black");//Draw the value on the y axis
                        drawListY.push(y);
                        this.drawDottedHorizontalLine(ctx, this.startX, this.endX, y);
                    }

                    if (this.checkRange(x, drawListX, fontSizeX)) {
                        this.drawChartText(ctx, Math.round(valX, 1), x, this.endY + 15, fontSizeX, "black");
                        drawListX.push(x);
                    }
                }

                //connect the points to create a line
                if (i !== 0) {
                    ctx.beginPath();
                    ctx.strokeStyle = `hsl(${lineColor}, 100%, 50%)`;
                    ctx.moveTo(prevX, prevY);
                    ctx.lineTo(x, y);
                    ctx.stroke();
                    //ctx.fill();
                    ctx.closePath();
                }


                //Draw the points
                if (parseInt(i % this.actualStepValueX) == 0 || i == 0) {
                    ctx.beginPath();
                    ctx.fillStyle = `hsl(${pointColor}, 100%, 50%)`;
                    ctx.arc(x, y, 2, 0, 2 * Math.PI);
                    //ctx.stroke();
                    ctx.fill();
                    ctx.closePath();
                }

                prevX = x;
                prevY = y;


            }
            lineColor += 100;
            lineColor %= 361;
            pointColor += 50;
            pointColor %= 361;
        }

        ctx.closePath();
        ctx.strokeStyle = "black";
    }

    updateMax() {
        this.data.forEach(data => {
            for (let i = 0; i < data.length; i++) {
                this.maxValX = Math.max(...data[i][0]);
                this.maxValY = Math.max(...data[i][1]);
            }
        });

    }
}

