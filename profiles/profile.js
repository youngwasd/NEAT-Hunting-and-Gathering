const loadProfile = (profile) => {
    let oldParams = params;
    let oldHTML = document.getElementsByTagName('html')[0].innerHTML;

    document.getElementById("save_to_db").checked = true;
    params.SAVE_TO_DB = true;

    let attributesLoaded = 0;
    let len = 0;
    for (let key in profile) {
        len++;
        let attr = profile[key];
        params[key] = attr.value;

        if (attr.additionalFunction) {
            attr.additionalFunction();
            attributesLoaded++;
            continue;
        }
        if (!attr.HTMLElementID) {
            console.log("Missing HTML Element in the field: " + key);
            continue;
        }
        let HTMLElement = document.getElementById(attr.HTMLElementID);
        if (HTMLElement.value) {
            HTMLElement.value = attr.value;
        }
        if (HTMLElement.checked) {
            HTMLElement.checked = attr.value;
        }
        attributesLoaded++;
        //console.log(key, value);
    }

    if (attributesLoaded === len) {
        console.log("All attributes loaded successfully");
        params.SIM_CURR_TRIAL = 0;
        gameEngine.population.resetSim();

    }
    else {
        console.log("Problem occurs during loading, reverting to the previous parameter specs");
        params = oldParams;
        document.getElementsByTagName('html')[0].innerHTML = oldHTML;
    }

};

//Example of profile
const simulationProfile_numberOfAgents_25 = {
    DB: {
        HTMLElementID: 'db',
        value: "NEATWi23"
    },

    NUM_AGENTS: {
        HTMLElementID: 'num_agents',
        value: 25,
    },

    DB_COLLECTION: {
        HTMLElementID: 'db_collection',
        value: "TotalNumberOfAgents_100"
    },

    GEN_TO_SAVE: {
        HTMLElementID: 'gen_to_save',
        value: 200,
    },

    SIM_TRIAL_NUM: {
        HTMLElementID: 'sim_trial_num',
        value: 3,
    },

    //Has a custom additional function to run before adding to the profile
    AGENT_PER_WORLD: {
        HTMLElementID: 'agent_per_world',
        value: 1,
        additionalFunction:
            () => {
                document.getElementById("restart_sim").click();
            },

    }
};



const profileList = {
    "25 Number of agents": simulationProfile_numberOfAgents_25,
};

const initProfiles = () => {
    select = document.getElementById('profileOption');

    for (let profileName in profileList) {
        let opt = document.createElement('option');
        opt.value = profileName;
        opt.innerHTML = profileName;
        select.appendChild(opt);
    }
};