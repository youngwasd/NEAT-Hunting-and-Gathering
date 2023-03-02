const loadProfile = (profile) => {
    document.getElementById("save_to_db").checked = true;
    params.SAVE_TO_DB = true;

    if (profile.DB){
        params.DB = profile.DB;
        document.getElementById("db").value = params.DB;
    }

    if (profile.DB_COLLECTION){
        params.DB_COLLECTION = profile.DB_COLLECTION;
        document.getElementById("db_collection").value = profile.DB_COLLECTION;
    }

    if (profile.GEN_TO_SAVE){
        params.GEN_TO_SAVE = profile.GEN_TO_SAVE;
        document.getElementById("gen_to_save").value = profile.GEN_TO_SAVE;
    }

    if (profile.SIM_TRIAL_NUM){
        params.SIM_TRIAL_NUM = profile.SIM_TRIAL_NUM;
        document.getElementById("sim_trial_num").value = profile.SIM_TRIAL_NUM;
    }

    if (profile.NUM_AGENTS){
        params.NUM_AGENTS = profile.NUM_AGENTS;
        document.getElementById("num_agents").value = profile.NUM_AGENTS;
    }

    if (profile.AGENT_PER_WORLD){
        params.AGENT_PER_WORLD = profile.AGENT_PER_WORLD;
        document.getElementById("agent_per_world").value = profile.AGENT_PER_WORLD;
    }

    //Update fitness
    if (profile.FITNESS_CALORIES){
        params.FITNESS_CALORIES = profile.FITNESS_CALORIES;
        document.getElementById("fitness_calories").value = profile.FITNESS_CALORIES;
    }

    if (profile.FITNESS_BUMPING_INTO_WALL){
        params.FITNESS_BUMPING_INTO_WALL = profile.FITNESS_BUMPING_INTO_WALL;
        document.getElementById("FITNESS_BUMPING_INTO_WALL").value = profile.FITNESS_BUMPING_INTO_WALL;
    }

    if (profile.FITNESS_OUT_OF_BOUND){
        params.FITNESS_OUT_OF_BOUND = profile.FITNESS_OUT_OF_BOUND;
        document.getElementById("FITNESS_OUT_OF_BOUND").value = profile.FITNESS_OUT_OF_BOUND;
    }

    if (profile.FITNESS_POTENTIAL_CALORIES){
        params.FITNESS_POTENTIAL_CALORIES = profile.FITNESS_POTENTIAL_CALORIES;
        document.getElementById("fitness_potential_cal").value = profile.FITNESS_POTENTIAL_CALORIES;
    }

    //Moving Food
    if (profile.MOVING_FOOD){
        params.MOVING_FOOD = profile.MOVING_FOOD;
        document.getElementById("moving_food").checked = profile.MOVING_FOOD;
    }

    if (profile.FOOD_VELOCITY_X){
        params.FOOD_VELOCITY_X = profile.FOOD_VELOCITY_X;
        document.getElementById("food_velocityX").value = profile.FOOD_VELOCITY_X;
    }

    if (profile.FOOD_VELOCITY_Y){
        params.FOOD_VELOCITY_Y = profile.FOOD_VELOCITY_Y;
        document.getElementById("food_velocityY").value = profile.FOOD_VELOCITY_Y;
    }




    params.SIM_CURR_TRIAL = 1; 
    gameEngine.population.resetSim(); 
};

//Just copy param for now
const simulationProfile_numberOfAgents_25 = {
    DB: "test",
    DB_COLLECTION: "NEATtests_NumberOfAgents_100",
    GEN_TO_SAVE: 200,
    SIM_TRIAL_NUM: 5,
    
    NUM_AGENTS: 25,
    AGENT_PER_WORLD : 1,
};

//Just copy param for now
const simulationProfile_numberOfAgents_50 = {
    DB: "test",
    DB_COLLECTION: "NEATtests_NumberOfAgents_100",
    GEN_TO_SAVE: 200,
    SIM_TRIAL_NUM: 5,
    
    NUM_AGENTS: 25,
    AGENT_PER_WORLD : 1,
};

const simulationProfile_numberOfAgents_75 = {
    DB: "test",
    DB_COLLECTION: "NEATtests_NumberOfAgents_100",
    GEN_TO_SAVE: 40,
    SIM_TRIAL_NUM: 5,
    
    NUM_AGENTS: 75,
    AGENT_PER_WORLD : 1,
};

const simulationProfile_numberOfAgents_100 = {
    DB: "test",
    DB_COLLECTION: "NEATtests_NumberOfAgents_100",
    GEN_TO_SAVE: 200,
    SIM_TRIAL_NUM: 5,
    
    NUM_AGENTS: 100,
    AGENT_PER_WORLD : 1,
};

//Moving Food Sim Profile

const simulationProfile_movingFood_Stationary = {
    DB: "NEATWi23",
    DB_COLLECTION: "MovingFood_Stationary",
    GEN_TO_SAVE: 200,
    SIM_TRIAL_NUM: 5,

    MOVING_FOOD: false,
    
    NUM_AGENTS: 50,
    AGENT_PER_WORLD : 1,
};

const simulationProfile_movingFood_Direct = {
    DB: "NEATWi23",
    DB_COLLECTION: "MovingFood_Direct",
    GEN_TO_SAVE: 200,
    SIM_TRIAL_NUM: 5,

    MOVING_FOOD: true,
    MOVING_FOOD_PATTERN: "direct",

    FOOD_VELOCITY_X: 1,
    FOOD_VELOCITY_Y: 1,
    
    NUM_AGENTS: 50,
    AGENT_PER_WORLD : 1,
};

const simulationProfile_movingFood_DrunkenSailor = {
    DB: "NEATWi23",
    DB_COLLECTION: "MovingFood_DrunkenSailor",
    GEN_TO_SAVE: 200,
    SIM_TRIAL_NUM: 5,

    MOVING_FOOD: true,
    MOVING_FOOD_PATTERN: "drunkenSailor",

    FOOD_VELOCITY_X: 1,
    FOOD_VELOCITY_Y: 1,
    
    NUM_AGENTS: 50,
    AGENT_PER_WORLD : 1,
};

const profileList = {
    "25 Number of agents": simulationProfile_numberOfAgents_25,
    "50 Number of agents": simulationProfile_numberOfAgents_50,
    "75 Number of agents": simulationProfile_numberOfAgents_75,
    "100 Number of agents": simulationProfile_numberOfAgents_100,
    "Stationary food": simulationProfile_movingFood_Stationary,
    "Direct Moving Food": simulationProfile_movingFood_Direct,
    "Drunken Sailor Moving Food": simulationProfile_movingFood_DrunkenSailor,
};

const initProfiles = () => {
    select = document.getElementById('profileOption');
    
    for (let profileName in profileList){
        let opt = document.createElement('option');
        opt.value = profileName;
        opt.innerHTML = profileName;
        select.appendChild(opt);
    }
};