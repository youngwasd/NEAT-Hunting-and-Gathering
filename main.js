const gameEngine = new GameEngine();

const ASSET_MANAGER = new AssetManager();

var socket = null;
if (window.io) {
	console.log("Database connected!");

	socket = io.connect('http://73.225.31.4:8888');

	socket.addEventListener("log", console.log);
}

ASSET_MANAGER.downloadAll(() => {

    let population = new PopulationManager(gameEngine);
    gameEngine.population = population;

    gameEngine.display = new DataDisplay(gameEngine);

    gameEngine.init();

    gameEngine.start();
});
