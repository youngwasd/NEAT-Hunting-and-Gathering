class Minimap {
    constructor(game, ctx, totalWidth, totalHeight) {
        Object.assign(this, { game, ctx , totalWidth, totalHeight});
        this.sizeOfAWorld = Math.trunc(params.CANVAS_SIZE / Math.sqrt(params.NUM_AGENTS));
    }
    update() {

    }

    draw(ctx = null) {
        if (ctx == null){
            ctx = this.ctx;
        }


    }
}