class DataDisplay {

    constructor(game) {
        this.game = game;
    }

    update() {

    };

    draw(ctx) {
        ctx.strokeStyle = "black";
        ctx.font = "20px sans-serif";
        ctx.textAlign = "left";
        ctx.lineWidth = 2;
        ctx.strokeText(`Generation: ${PopulationManager.GEN_NUM}`, 10, 30);
        ctx.strokeText(`Next In: ${params.GEN_TICKS - this.game.population.tickCounter} ticks`, 10, 60);
        if (params.SAVE_TO_DB) {
            ctx.strokeText(`Trial: ${params.SIM_CURR_TRIAL}`, 10, 90);
        }
        ctx.textAlign = "center";
        let world = this.game.population.worlds.get(this.worldId);

        ctx.strokeText(`World: ${this.worldId}`, params.CANVAS_SIZE / 2, 30);
        ctx.strokeText(`Agent Count: ${this.game.population.countAlives(this.worldId)}`, params.CANVAS_SIZE / 2, 60);

        //Displaying Species list
        if (params.AGENT_PER_WORLD !== 0 || params.SPLIT_SPECIES) {
            let speciesText = [];

            let i = 0, j = 0;
            let text = "";
            let speciesPerLine = Math.sqrt(world.speciesList.size);

            world.speciesList.forEach(specie => {
                if (text !== "") {
                    text += ", ";
                }
                text += specie;
                i++;
                if (i >= speciesPerLine) {
                    i = 0;
                    speciesText.push(text);
                    text = "";
                }
            });
            if (text !== "") {
                speciesText.push(text);
            }
            let yStart = 90;

            //Insert enter for viewing capability

            //console.log(speciesText, speciesText.length);
            ctx.font = "16px sans-serif";
            speciesText.forEach(text => {
                ctx.strokeText(`${yStart == 90 ? "Species: " : ""}${text}`, params.CANVAS_SIZE / 2, yStart);
                yStart += 30;
            });

        }

        ctx.font = "20px sans-serif";

        //Alert user that all agents are drawned in the first world

        let firstWorldId = this.game.population.worlds.entries().next().value[1].worldId;
        if (this.worldId !== firstWorldId) {
            if (!this.game.population.worlds.get(this.worldId).isActive) {
                ctx.strokeText("World is not active", params.CANVAS_SIZE / 2, params.CANVAS_SIZE / 3);
            }
            else if (params.DISPLAY_SAME_WORLD) {
                    ctx.strokeText(`All agents and food are drawn in the first world with the ID: ${firstWorldId}`, params.CANVAS_SIZE / 2, params.CANVAS_SIZE / 3);
                }

        }



        ctx.textAlign = "right";
        ctx.strokeText(`Living Species: ${PopulationManager.SPECIES_MEMBERS.size}`, params.CANVAS_SIZE - 10, 30);
        ctx.strokeText(`Total Species: ${PopulationManager.SPECIES_CREATED}`, params.CANVAS_SIZE - 10, 60);
        ctx.strokeText(`Total Active World: ${this.game.population.worlds.size}`, params.CANVAS_SIZE - 10, 90);

    };
};