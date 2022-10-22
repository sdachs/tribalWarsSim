DSUtil = {
    mineBaseProd: 1,
    speed: 1.6,
    buildConf: null,
    bonusProd: 1,
    // 1.2 for 20% more
    datalvl: false,
    checklvl(lvl, type) {
        return parseInt(lvl != null ? lvl : type && this.datalvl ? game_data.village.buildings[type] : null)
    },

    getStorage(lvl) {
        let storage_values = [813, 1000, 1229, 1512, 1859, 2285, 2810, 3454, 4247, 5222, 6420, 7893, 9705, 11932, 14670, 18037, 22177, 27266, 33523, 41217, 50675, 62305, 76604, 94184, 115798, 142373, 175047, 215219, 264611, 325337, 400000]
        return storage_values[this.checklvl(lvl, 'storage')]
        //return Math.round(1000 * Math.pow(1.2294934, this.checklvl(lvl, 'storage') - 1))
    },
    getFarm(lvl) {
        let farm_values = [205, 240, 281, 330, 386, 453, 531, 622, 729, 855, 1002, 1175, 1377, 1614, 1891, 2217, 2598, 3046, 3570, 4184, 4904, 5748, 6737, 7897, 9256, 10849, 12716, 14904, 17470, 20476, 24000]
        return farm_values[this.checklvl(lvl, 'farm')]
        //return Math.round(240 * Math.pow(1.17210245334, this.checklvl(lvl, 'farm') - 1))
    },

    getMarket(lvl) {
        let marketTradesmen = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 14, 19, 26, 35, 46, 59, 74, 91, 110, 131, 154, 179, 206, 235]
        return marketTradesmen[this.checklvl(lvl, 'market')]
    },
    getResProduction(lvl, type) {
        //return Math.round(parseFloat(this.mineBaseProd * 30) * parseFloat(this.speed) * Math.pow(1.163118, (this.checklvl(lvl, 'type') - 1)) * (type && game_data.village.bonus != null && game_data.village.bonus[type] != null && this.bonusProd == null ? game_data.village.bonus[type] : this.bonusProd != null ? this.bonusProd : 1))
        return Math.round(parseFloat(this.mineBaseProd * 30) * parseFloat(this.speed) * Math.pow(1.163118, (this.checklvl(lvl, 'type') - 1)) * (this.bonusProd != null ? this.bonusProd : 1))
    },
    hqFactor(lvl) {
        return Math.pow(1.05, (-this.checklvl(lvl, 'main')))
    },
    buildCost(building, lvl, res) {
        if (res == null || typeof res == 'undefined') {
            return [this.buildCost(building, lvl, 'wood'), this.buildCost(building, lvl, 'stone'), this.buildCost(building, lvl, 'iron')]
        }
        return Math.round((this.buildConf[building][res]) * (Math.pow(this.buildConf[building][res + '_factor'], (parseInt(lvl) - 1))))
    },
    buildCostSum(building, lvl) {
        return this.buildCost(building, lvl, 'wood') + this.buildCost(building, lvl, 'stone') + this.buildCost(building, lvl, 'iron')
    },
    buildTime(building, lvl, hqlvl) {
        let min_times = [0.076531875, 0.008575, 0.1611688357125, 0.49997092217822, 0.95648692484371, 1.507915906133, 2.1583894342689, 2.9234350042923, 3.8258560762261, 4.8929653630626, 6.1578892138254, 7.6590657112219, 9.4433064708667, 11.564692858728, 14.087747339219, 17.087827532738, 20.656815089182, 24.899818499248, 29.943903177098, 35.937391973395, 43.057125537371, 51.513283593952, 61.553558650789, 73.469813455449, 87.609924818161, 104.38073172038, 124.27318094664, 147.85747137631, 175.8153675657, 208.94719428012]
        let build_time = this.buildConf[building]['build_time'] / this.speed
        let hq_factor = this.hqFactor(hqlvl)
        let calculated_time = hq_factor * build_time * (min_times[lvl - 1])
        return Math.round(calculated_time)
    },
    convertSecToTimeString(sec) {
        let time = ''
        let hours = Math.floor(sec / 3600)
        let mins = Math.floor((sec - 3600 * hours) / 60)
        let secs = Math.floor((sec - 3600 * hours - 60 * mins))
        time += hours + ":"
        time += mins < 10 ? "0" + mins : mins
        time += ":"
        time += secs < 10 ? "0" + secs : secs
        return time
    },
    convertTimeStringToSec(time) {
        var time_array = time.split(':')
        var sec = 0
        time_array.forEach((e,i,array)=>{
            sec += parseInt(e) * Math.pow(60, array.length - i - 1)
        }
        )
        return sec
    },
    popUsed(buildingType, level) {
        let building = this.buildConf[buildingType]
        level = parseInt(level)
        if (typeof building === 'undefined' || level === 0) {
            return 0;
        }
        return Math.round(building.pop * building.pop_factor ** (parseInt(level) - 1));
    },
    popUsedVillage(buildings) {
        let sum = 0
        for (let building of Object.keys(buildings)) {
            sum += this.popUsed(building, buildings[building])
        }
        return sum;
    },
    pointsVillage(buildings) {
        let sum = 0
        for (let building of Object.keys(buildings)) {
            let index = parseInt(buildings[building]) - 1
            if (index >= 0) {
                sum += this.buildingPoints[building].slice(0, index + 1).reduce((a,b)=>a + b)
            }
        }
        return sum;
    },
    getBuildingObj(type, lvl, hqlvl) {
        let building = {
            id: type + '|' + (parseInt(lvl)) + '|' + hqlvl,
            name: type,
            wood: DSUtil.buildCost(type, lvl, "wood"),
            stone: DSUtil.buildCost(type, lvl, "stone"),
            iron: DSUtil.buildCost(type, lvl, "iron"),
            sumCost: 0,
            time: DSUtil.buildTime(type, lvl, hqlvl),
            lvl: lvl,
            hqlvl: hqlvl,
            timePassed: 0,
            timesReduced: 0,
            cheap: false,
            pop: DSUtil.popUsed(type, lvl) - DSUtil.popUsed(type, lvl - 1),
            cWood: 0,
            cStone: 0,
            cIron: 0,
            cCost: 0,
        }
        building.sumCost = (building.wood + building.stone + building.iron)
        building.cWood = Math.round(building.wood * 0.8)
        building.cStone = Math.round(building.stone * 0.8)
        building.cIron = Math.round(building.iron * 0.8)
        building.cCost = (building.cWood + building.cStone + building.cIron)
        return building
    },
    buildingReqirementsMet(buildings, type) {
        switch (type) {
        case "barracks":
            return (buildings["main"] >= 3)
        case "stable":
            return (buildings["main"] >= 10 && buildings["barracks"] >= 5 && buildings["smith"] >= 5)
        case "garage":
            return (buildings["main"] >= 10 && buildings["smith"] >= 10)
        case "snob":
            return (buildings["main"] >= 20 && buildings["market"] >= 10 && buildings["smith"] >= 20)
        case "smith":
            return (buildings["main"] >= 5 && buildings["barracks"] >= 1)
        case "market":
            return (buildings["main"] >= 3 && buildings["storage"] >= 2)
        case "wall":
            return (buildings["barracks"] >= 1)
        case "main":
        case "wood":
        case "stone":
        case "iron":
        case "farm":
        case "storage":
        case "hide":
        default:
            return true
        }
    },
    buildingPoints: {
        'main': [10, 2, 2, 3, 4, 4, 5, 6, 7, 9, 10, 12, 15, 18, 21, 26, 31, 37, 44, 53, 64, 77, 92, 110, 133, 159, 191, 229, 274, 330],
        'barracks': [16, 3, 4, 5, 5, 7, 8, 9, 12, 14, 16, 20, 24, 28, 34, 42, 49, 59, 71, 85, 102, 123, 147, 177, 212],
        'stable': [20, 4, 5, 6, 6, 9, 10, 12, 14, 17, 21, 25, 29, 36, 43, 51, 62, 74, 88, 107],
        'garage': [24, 5, 6, 6, 9, 10, 12, 14, 17, 21, 25, 29, 36, 43, 51],
        'church': [10, 2, 2],
        'church_f': [10],
        'snob': [512, 102, 123],
        'smith': [19, 4, 4, 6, 6, 8, 10, 11, 14, 16, 20, 23, 28, 34, 41, 49, 58, 71, 84, 101],
        'place': [0],
        'statue': [24],
        'market': [10, 2, 2, 3, 4, 4, 5, 6, 7, 9, 10, 12, 15, 18, 21, 26, 31, 37, 44, 53, 64, 77, 92, 110, 133, 159, 191, 229, 274, 330],
        'wood': [6, 1, 2, 1, 2, 3, 3, 3, 5, 5, 6, 8, 8, 11, 13, 15, 19, 22, 27, 32, 38, 46, 55, 66, 80, 95, 115, 137, 165, 198],
        'stone': [6, 1, 2, 1, 2, 3, 3, 3, 5, 5, 6, 8, 8, 11, 13, 15, 19, 22, 27, 32, 38, 46, 55, 66, 80, 95, 115, 137, 165, 198],
        'iron': [6, 1, 2, 1, 2, 3, 3, 3, 5, 5, 6, 8, 8, 11, 13, 15, 19, 22, 27, 32, 38, 46, 55, 66, 80, 95, 115, 137, 165, 198],
        'farm': [5, 1, 1, 2, 1, 2, 3, 3, 3, 5, 5, 6, 8, 8, 11, 13, 15, 19, 22, 27, 32, 38, 46, 55, 66, 80, 95, 115, 137, 165],
        'storage': [6, 1, 2, 1, 2, 3, 3, 3, 5, 5, 6, 8, 8, 11, 13, 15, 19, 22, 27, 32, 38, 46, 55, 66, 80, 95, 115, 137, 165, 198],
        'hide': [5, 1, 1, 2, 1, 2, 3, 3, 3, 5],
        'wall': [8, 2, 2, 2, 3, 3, 4, 5, 5, 7, 9, 9, 12, 15, 17, 20, 25, 29, 36, 43],
        'watchtower': [42, 8, 10, 13, 14, 18, 20, 25, 31, 36, 43, 52, 62, 75, 90, 108, 130, 155, 186, 224]
    },
    buildConf: {
        "main": {
            "max_level": "30",
            "min_level": "1",
            "wood": "90",
            "stone": "80",
            "iron": "70",
            "pop": "5",
            "wood_factor": "1.26",
            "stone_factor": "1.275",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "900",
            "build_time_factor": "1.2"
        },
        "barracks": {
            "max_level": "25",
            "min_level": "0",
            "wood": "200",
            "stone": "170",
            "iron": "90",
            "pop": "7",
            "wood_factor": "1.26",
            "stone_factor": "1.28",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "1800",
            "build_time_factor": "1.2"
        },
        "stable": {
            "max_level": "20",
            "min_level": "0",
            "wood": "270",
            "stone": "240",
            "iron": "260",
            "pop": "8",
            "wood_factor": "1.26",
            "stone_factor": "1.28",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "6000",
            "build_time_factor": "1.2"
        },
        "garage": {
            "max_level": "15",
            "min_level": "0",
            "wood": "300",
            "stone": "240",
            "iron": "260",
            "pop": "8",
            "wood_factor": "1.26",
            "stone_factor": "1.28",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "6000",
            "build_time_factor": "1.2"
        },
        "church": {
            "max_level": "3",
            "min_level": "0",
            "wood": "16000",
            "stone": "20000",
            "iron": "5000",
            "pop": "5000",
            "wood_factor": "1.26",
            "stone_factor": "1.28",
            "iron_factor": "1.26",
            "pop_factor": "1.55",
            "build_time": "184980",
            "build_time_factor": "1.2"
        },
        "church_f": {
            "max_level": "1",
            "min_level": "0",
            "wood": "160",
            "stone": "200",
            "iron": "50",
            "pop": "5",
            "wood_factor": "1.26",
            "stone_factor": "1.28",
            "iron_factor": "1.26",
            "pop_factor": "1.55",
            "build_time": "8160",
            "build_time_factor": "1.2"
        },
        "watchtower": {
            "max_level": "20",
            "min_level": "0",
            "wood": "12000",
            "stone": "14000",
            "iron": "10000",
            "pop": "500",
            "wood_factor": "1.17",
            "stone_factor": "1.17",
            "iron_factor": "1.18",
            "pop_factor": "1.18",
            "build_time": "13200",
            "build_time_factor": "1.2"
        },
        "snob": {
            "max_level": "1",
            "min_level": "0",
            "wood": "15000",
            "stone": "25000",
            "iron": "10000",
            "pop": "80",
            "wood_factor": "2",
            "stone_factor": "2",
            "iron_factor": "2",
            "pop_factor": "1.17",
            "build_time": "586800",
            "build_time_factor": "1.2"
        },
        "smith": {
            "max_level": "20",
            "min_level": "0",
            "wood": "220",
            "stone": "180",
            "iron": "240",
            "pop": "20",
            "wood_factor": "1.26",
            "stone_factor": "1.275",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "6000",
            "build_time_factor": "1.2"
        },
        "place": {
            "max_level": "1",
            "min_level": "0",
            "wood": "10",
            "stone": "40",
            "iron": "30",
            "pop": "0",
            "wood_factor": "1.26",
            "stone_factor": "1.275",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "10860",
            "build_time_factor": "1.2"
        },
        "statue": {
            "max_level": "1",
            "min_level": "0",
            "wood": "220",
            "stone": "220",
            "iron": "220",
            "pop": "10",
            "wood_factor": "1.26",
            "stone_factor": "1.275",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "1500",
            "build_time_factor": "1.2"
        },
        "market": {
            "max_level": "25",
            "min_level": "0",
            "wood": "100",
            "stone": "100",
            "iron": "100",
            "pop": "20",
            "wood_factor": "1.26",
            "stone_factor": "1.275",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "2700",
            "build_time_factor": "1.2"
        },
        "wood": {
            "max_level": "30",
            "min_level": "0",
            "wood": "50",
            "stone": "60",
            "iron": "40",
            "pop": "5",
            "wood_factor": "1.25",
            "stone_factor": "1.275",
            "iron_factor": "1.245",
            "pop_factor": "1.155",
            "build_time": "900",
            "build_time_factor": "1.2"
        },
        "stone": {
            "max_level": "30",
            "min_level": "0",
            "wood": "65",
            "stone": "50",
            "iron": "40",
            "pop": "10",
            "wood_factor": "1.27",
            "stone_factor": "1.265",
            "iron_factor": "1.24",
            "pop_factor": "1.14",
            "build_time": "900",
            "build_time_factor": "1.2"
        },
        "iron": {
            "max_level": "30",
            "min_level": "0",
            "wood": "75",
            "stone": "65",
            "iron": "70",
            "pop": "10",
            "wood_factor": "1.252",
            "stone_factor": "1.275",
            "iron_factor": "1.24",
            "pop_factor": "1.17",
            "build_time": "1080",
            "build_time_factor": "1.2"
        },
        "farm": {
            "max_level": "30",
            "min_level": "1",
            "wood": "45",
            "stone": "40",
            "iron": "30",
            "pop": "0",
            "wood_factor": "1.3",
            "stone_factor": "1.32",
            "iron_factor": "1.29",
            "pop_factor": "1",
            "build_time": "1200",
            "build_time_factor": "1.2"
        },
        "storage": {
            "max_level": "30",
            "min_level": "1",
            "wood": "60",
            "stone": "50",
            "iron": "40",
            "pop": "0",
            "wood_factor": "1.265",
            "stone_factor": "1.27",
            "iron_factor": "1.245",
            "pop_factor": "1.15",
            "build_time": "1020",
            "build_time_factor": "1.2"
        },
        "hide": {
            "max_level": "10",
            "min_level": "0",
            "wood": "50",
            "stone": "60",
            "iron": "50",
            "pop": "2",
            "wood_factor": "1.25",
            "stone_factor": "1.25",
            "iron_factor": "1.25",
            "pop_factor": "1.17",
            "build_time": "1800",
            "build_time_factor": "1.2"
        },
        "wall": {
            "max_level": "20",
            "min_level": "0",
            "wood": "50",
            "stone": "100",
            "iron": "20",
            "pop": "5",
            "wood_factor": "1.26",
            "stone_factor": "1.275",
            "iron_factor": "1.26",
            "pop_factor": "1.17",
            "build_time": "3600",
            "build_time_factor": "1.2"
        }
    }

}

function updateUI() {
    //update
    updateSettings()
    updateConstruction()
    updateQueTable()
    updateVillageInfo(simVillage)
    updateTemplate()
    initTT()
}

function init() {
    simVillage = {
        building: {
            main: 1,
            barracks: 0,
            stable: 0,
            garage: 0,
            snob: 0,
            smith: 0,
            market: 0,
            wood: 0,
            stone: 0,
            iron: 0,
            farm: 1,
            storage: 1,
            hide: 0,
            wall: 0
            /*barracks: 25,
            farm: 30,
            garage: 8,
            hide: 9,
            iron: 30,
            main: 20,
            market: 23,
            place: 1,
            smith: 20,
            snob: 1,
            stable: 20,
            stone: 30,
            storage: 30,
            wall: 20,
            wood: 30*/
        },
        nextbuilding: {
            main: 1,
            barracks: 0,
            stable: 0,
            garage: 0,
            snob: 0,
            smith: 0,
            market: 0,
            wood: 0,
            stone: 0,
            iron: 0,
            farm: 1,
            storage: 1,
            hide: 0,
            wall: 0
            /*barracks: 25,
            farm: 30,
            garage: 8,
            hide: 9,
            iron: 30,
            main: 20,
            market: 23,
            place: 1,
            smith: 20,
            snob: 1,
            stable: 20,
            stone: 30,
            storage: 30,
            wall: 20,
            wood: 30*/
        },
        wood: 900,
        stone: 900,
        iron: 900,
        pop: ()=>DSUtil.popUsedVillage(simVillage.nextbuilding),
        points: ()=>DSUtil.pointsVillage(simVillage.building),
        pop_max: ()=>DSUtil.getFarm(simVillage.building["farm"]),
        storage_max: ()=>DSUtil.getStorage(simVillage.building["storage"]),
        wood_prod: (e)=>DSUtil.getResProduction(simVillage.building["wood"] + (e == undefined ? 0 : e), 'wood') / 3600,
        stone_prod: (e)=>DSUtil.getResProduction(simVillage.building["stone"] + (e == undefined ? 0 : e), 'stone') / 3600,
        iron_prod: (e)=>DSUtil.getResProduction(simVillage.building["iron"] + (e == undefined ? 0 : e), 'iron') / 3600,
        age: 0,
        ppUsed: 0,
        bounty: []//use push() and shift()
    }
    buildQue = []
    template = ""
    constructionObjs = {}
    startRes = {w:900,s:900,i:900}
    startRes.building = {...simVillage.building}

    //setup(1.6,1,1,900,900,900,"{barracks:25,farm:30,garage:8,hide:9,iron:30,main:20,market:23,place:1,smith:20,snob:1,stable:20,stone:30,storage:30,wall:20,wood:30}");
    setup(1.25,2,1.35,900,900,900,"{main:1,barracks:0,stable:0,garage:0,snob:0,smith:0,market:0,wood:0,stone:0,iron:0,farm:1,storage:1,hide:0,wall:0}");
    //updateUI();
}
init()

//Logic part
function build(id, cheap) {
    let constrObj = constructionObjs[id]
    let enoughWood = simVillage.wood - (cheap ? constrObj.cWood : constrObj.wood)
    let enoughStone = simVillage.stone - (cheap ? constrObj.cStone : constrObj.stone)
    let enoughIron = simVillage.iron - (cheap ? constrObj.cIron : constrObj.iron)

    if (enoughWood >= 0 && enoughStone >= 0 && enoughIron >= 0) {
        template += "build(" + id + "," + cheap + ");"
        simVillage.wood = enoughWood
        simVillage.stone = enoughStone
        simVillage.iron = enoughIron
        if (cheap) {
            simVillage.ppUsed += 30
            constrObj.cheap = true
        }
        buildQue.push(constrObj)
        //let[type,lvl,hqlvl] = id.split('|')
        simVillage.nextbuilding[constrObj.name] = parseInt(constrObj.lvl)

        updateUI()
    } else {
        idle((cheap ? constrObj.cWood : constrObj.wood), (cheap ? constrObj.cStone : constrObj.stone), (cheap ? constrObj.cIron : constrObj.iron))
    }
}

function idle(wood, stone, iron, idleTime) {
    wood=parseFloat(wood);
    stone=parseFloat(stone);
    iron=parseFloat(iron);
    idleTime=parseFloat(idleTime);

    template += "idle(" + wood + "," + stone + "," + iron + "," + idleTime + ");"
    let time = simVillage.age
    let diffWood = wood - simVillage.wood
    let diffStone = stone - simVillage.stone
    let diffIron = iron - simVillage.iron

    function isIdle() {
        return idleTime == undefined || isNaN(idleTime);
    }

    while (isIdle() ? (Math.max(diffWood, diffStone, diffIron) > 0) : (time < (idleTime + simVillage.age))) {
        let waitingTime = (isIdle() ? (Math.max(diffWood / simVillage.wood_prod(), diffStone / simVillage.stone_prod(), diffIron / simVillage.iron_prod())) : idleTime)
        if (buildQue.length > 0) {
            let constrObj = buildQue[0]
            let timeLeft = (constrObj.time / Math.pow(2, constrObj.timesReduced)) - constrObj.timePassed
            if (waitingTime >= timeLeft) {
                //calc res for timeLeft of Building in que
                if (isIdle()) {
                    diffWood -= timeLeft * simVillage.wood_prod()
                    diffStone -= timeLeft * simVillage.stone_prod()
                    diffIron -= timeLeft * simVillage.iron_prod()
                } else {
                    simVillage.wood += timeLeft * simVillage.wood_prod()
                    simVillage.stone += timeLeft * simVillage.stone_prod()
                    simVillage.iron += timeLeft * simVillage.iron_prod()
                }
                time += timeLeft

                //finisch Building 
                simVillage.building[constrObj.name] = parseInt(constrObj.lvl)
                constrObj.timePassed += timeLeft

                let finishedBuilding = buildQue.shift()
                simVillage.bounty.push({
                    wood: Math.max(150, Math.min((0.1*finishedBuilding.wood), 2000)),
                    stone: Math.max(150, Math.min((0.1*finishedBuilding.stone), 2000)),
                    iron: Math.max(100, Math.min((0.1*finishedBuilding.iron), 2000))
                })
                console.log(finishedBuilding)
                //TODO template

            } else {
                //calc res for waitingTime
                if (isIdle()) {
                    diffWood -= waitingTime * simVillage.wood_prod()
                    diffStone -= waitingTime * simVillage.stone_prod()
                    diffIron -= waitingTime * simVillage.iron_prod()
                } else {
                    simVillage.wood += waitingTime * simVillage.wood_prod()
                    simVillage.stone += waitingTime * simVillage.stone_prod()
                    simVillage.iron += waitingTime * simVillage.iron_prod()
                }
                time += waitingTime

                //progress Building 
                constrObj.timePassed += time - simVillage.age
            }
        } else {
            //calc res for waitingTime
            if (isIdle()) {
                diffWood -= waitingTime * simVillage.wood_prod()
                diffStone -= waitingTime * simVillage.stone_prod()
                diffIron -= waitingTime * simVillage.iron_prod()
            } else {
                simVillage.wood += waitingTime * simVillage.wood_prod()
                simVillage.stone += waitingTime * simVillage.stone_prod()
                simVillage.iron += waitingTime * simVillage.iron_prod()
            }
            time += waitingTime
        }
    }
    //calculate new storage values
    if (isIdle()) {
        simVillage.wood = wood - diffWood
        simVillage.stone = stone - diffStone
        simVillage.iron = iron - diffIron
    }

    simVillage.age = time
    updateUI()

}

function simIdle(wood, stone, iron) {
    let time = simVillage.age
    let diffWood = wood - simVillage.wood
    let diffStone = stone - simVillage.stone
    let diffIron = iron - simVillage.iron

    let queFix = 0
    let woodFix = 0
    let stoneFix = 0
    let ironFix = 0

    while (Math.max(diffWood, diffStone, diffIron) > 0) {
        let waitingTime = Math.max(diffWood / simVillage.wood_prod(woodFix), diffStone / simVillage.stone_prod(stoneFix), diffIron / simVillage.iron_prod(ironFix))
        if (buildQue.length > 0 + queFix) {
            let constrObj = buildQue[0 + queFix]
            let timeLeft = (constrObj.time / Math.pow(2, constrObj.timesReduced)) - constrObj.timePassed
            if (waitingTime >= timeLeft) {
                //calc res for timeLeft of Building in que
                diffWood -= timeLeft * simVillage.wood_prod(woodFix)
                diffStone -= timeLeft * simVillage.stone_prod(stoneFix)
                diffIron -= timeLeft * simVillage.iron_prod(ironFix)
                time += timeLeft

                //adjust 
                switch (constrObj.name) {
                case "wood":
                    woodFix++
                    break
                case "stone":
                    stoneFix++
                    break
                case "iron":
                    ironFix++
                    break
                default:
                    break
                }
                queFix++
            } else {
                diffWood -= waitingTime * simVillage.wood_prod(woodFix)
                diffStone -= waitingTime * simVillage.stone_prod(stoneFix)
                diffIron -= waitingTime * simVillage.iron_prod(ironFix)
                time += waitingTime
            }
        } else {
            diffWood -= waitingTime * simVillage.wood_prod(woodFix)
            diffStone -= waitingTime * simVillage.stone_prod(stoneFix)
            diffIron -= waitingTime * simVillage.iron_prod(ironFix)
            time += waitingTime
        }
    }

    return {
        possibleAt: time,
        wood: wood - diffWood,
        stone: stone - diffStone,
        iron: iron - diffIron,
    }
}

function reduceTime(id) {
    template += "reduceTime(" + id + ");"
    buildQue.find(e=>e.id === id).timesReduced += 1
    simVillage.ppUsed += 10

    updateUI()
}

function cancel(id) {
    let [type,lvl,hqlvl] = id.split('|')
    //check for same building more than one time in que
    let matchingType = buildQue.filter(e=>e.id.includes(type))
    if (matchingType.length > 1){
        matchingType = matchingType.sort((a,b)=>a.lvl<b.lvl)
        lvl = matchingType[0].lvl
        hqlvl = matchingType[0].hqlvl
        id = (type + '|' + (parseInt(lvl)) + '|' + hqlvl)
    }
    //remove building from que and template
    let index = buildQue.findIndex(e=>e.id === id)
    if (index > -1) {
        let constrObj = buildQue[index]
        simVillage.ppUsed -= (10 * constrObj.timesReduced) + (constrObj.cheap ? 30 : 0)
        simVillage.wood += (constrObj.cheap ? constrObj.cWood : constrObj.wood)
        simVillage.stone += (constrObj.cheap ? constrObj.cStone : constrObj.stone)
        simVillage.iron += (constrObj.cheap ? constrObj.cIron : constrObj.iron)
        simVillage.nextbuilding[constrObj.name] = parseInt(constrObj.lvl - 1)
        simVillage.age -= constrObj.timePassed

        buildQue.splice(index, 1);
        template  = template.replace("build("+id+","+constrObj.cheap+");",'')
        //remove element

        updateUI()
    }
}

function claim() {
    template += "claim();"
    let bounty = simVillage.bounty.shift()
    simVillage.wood += bounty.wood
    simVillage.stone += bounty.stone
    simVillage.iron += bounty.iron

    //update
    updateQueTable()
    updateVillageInfo(simVillage)
    updateConstruction()
    updateTemplate()
    initTT()
}

function loadTemplate(unprocessedTemplate) {
    let actions = unprocessedTemplate.split(';')
    for (let index = 0; index < actions.length - 1; index++) {
        let [task, vars] = actions[index].split('(')
        switch (task) {
            case "claim":
                claim()
                break;
            case "cancel":
                cancel(vars.replace(')', '').replaceAll("'", ''))
                break;
            case "reduceTime":
                reduceTime(vars.replace(')', '').replaceAll("'", ''))
                break;
            case "idle":
                let [wood, stone, iron, idleTime] = vars.split(',')
                if ('undefined' == idleTime.replace(')', '')) {
                    idle(wood, stone, iron)
                } else {
                    idle(wood, stone, iron, idleTime.replace(')', ''))
                }
                break;
            case "build":
                let [id, cheap] = vars.split(',')
                build(id.replaceAll("'", ''), cheap.replace(')', '') == "true")
                break;
            case "setup":
               let [speed, baseProd,bonusPRod,w,s,i,building] = vars.split('|')
                setup(speed,baseProd,bonusPRod,w,s,i,building)
                break;
            default:
                alert('Fehler bei:' + actions[index])
        }
    }
    //alert("Erfolgreich geladen")
}

function promptTemplate() {
    let unprocessedTemplate = prompt("Configuration hier einfügen")//$('#c_config')[0].value
    loadTemplate(unprocessedTemplate);
}

function revertLastStep(){
    let unprocessedTemplate = $('#c_config')[0].value
    let tmp = unprocessedTemplate.match(/;[^;]*;$/)
    if(tmp != null && tmp.length>0) {
        loadTemplate(unprocessedTemplate.replace(/;[^;]*;$/, ';'))
    } else {
        loadTemplate(unprocessedTemplate);
    }
}

function updateSettings(){
    let text = `
    <th>Geschwindichkeit: <input id="speed" style="width: 4em;margin:  1px;" min="1" max="5" value="${DSUtil.speed}"></input></th>
    <th>Minen-Basisproduktion: <input id="baseProd" style="width: 4em;margin:  1px;" min="1" max="5" value="${DSUtil.mineBaseProd}"></input></th>
    <th>Bonusproduktion in % : <input id="bonusProd" style="width: 4em;margin:  1px;" min="0" max="93" value="${DSUtil.bonusProd*100-100}"></input></th>
    <th>Holz : <input id="wood" style="width: 4em;margin:  1px;" min="0" max="400000" value="${startRes.w}"></input></th>
    <th>Lehm : <input id="stone" style="width: 4em;margin:  1px;" min="0" max="400000" value="${startRes.s}"></input></th>
    <th>Eisen : <input id="iron" style="width: 4em;margin:  1px;" min="0" max="400000" value="${startRes.i}"></input></th>
    <th>Gebäude: <input id="buildings" style="width: 4em;margin:  1px;" value="${JSON.stringify(startRes.building).replaceAll('"','')}"></input></th>
    <th><a class="btn" onclick="applySettings()">Anwenden</a></th>
`
    $('#rtfr-header').html(text);
}

function applySettings() {
    if($('#c_config')[0].value.match(/;[^;]*;$/).length==0||confirm("Sind sie sicher das sie mit den Einstellungen der Kopfleiste wieder neu beginnen wollen?")) {
        setup(parseFloat($('#speed')[0].value),
            parseFloat($('#baseProd')[0].value),
            1 + (parseFloat($('#bonusProd')[0].value)) / 100,
            parseFloat($('#wood')[0].value),
            parseFloat($('#stone')[0].value),
            parseFloat($('#iron')[0].value),
            $('#buildings')[0].value);
    }
}

function setup(speed,baseProd,bonusProd,w,s,i,building){
    DSUtil.speed = parseFloat(speed)
    DSUtil.mineBaseProd = parseFloat(baseProd)
    DSUtil.bonusProd = parseFloat(bonusProd)
    simVillage.wood = parseFloat(w)
    simVillage.stone = parseFloat(s)
    simVillage.iron = parseFloat(i)
    simVillage.building = parseBuilding(building)

    startRes.w = parseFloat(w)
    startRes.s = parseFloat(s)
    startRes.i = parseFloat(i)
    startRes.building = {...simVillage.building}

    let templ = "setup("+DSUtil.speed+"|"+DSUtil.mineBaseProd+"|"+DSUtil.bonusProd+"|"+simVillage.wood+"|"+simVillage.stone+"|"+simVillage.iron+"|"+JSON.stringify(simVillage.building).replaceAll('"','')+");"
    template = templ

    simVillage.nextbuilding = {...simVillage.building}
    simVillage.ppUsed = 0
    simVillage.age = 0
    simVillage.bounty = []
    buildQue = []
    constructionObjs = {}

    updateUI()
}

function parseBuilding(text) {
    let building = {}
    let buildings = text.replace('{','').replace('}','').split(',')
    for (const build of buildings) {
        const [type,lvl] = build.split(':')
        building[type] = parseInt(lvl)
    }
    return building
}

//UI part

function updateTemplate() {
    const elements = `
	<h2>Configuration<h2>
	<input id="c_config" style="width: 81%;" disabled>
	<a class="btn"onclick="copyTextToClipboard($('#c_config')[0].value)")>Kopieren</a>
	<a class="btn" onclick="promptTemplate()">Laden</a>
	`
    $('.rtfr-am-sim-template').html(elements);
    $('#c_config')[0].value = template
}

function updateConstruction() {
    let constructionRows = ""
    if (buildQue.length < 5) {
        let hqlvl = simVillage.nextbuilding["main"]
        for (let building of Object.keys(simVillage.nextbuilding)) {
            //Construcktion
            let lvl = simVillage.nextbuilding[building]
            if (parseInt(DSUtil.buildConf[building].max_level) > parseInt(lvl) && DSUtil.buildingReqirementsMet(simVillage.nextbuilding, building)) {
                let constrObj = DSUtil.getBuildingObj(building, parseInt(lvl) + 1, hqlvl)
                constructionObjs[constrObj.id] = constrObj
                constructionRows += buildingRow(constrObj)
            }
        }
    } else {
        constructionRows += `<tr>
		                <td colspan="7;">Es können nur 5 Bauaufträge in der Bauwarteschlange sein</td>
		            </tr>`
    }
    const table = `<table id="c_construction" class="vis nowrap rtfr-table" style="width: 100%;">
		        <tbody>
		            <tr>
		                <th style="width: 23%">Gebäude</th>
		                <th colspan="5">Bedarf</th>
		                <th style="width: 30%">Bauen</th>
		            </tr>
		            ${constructionRows}
		        </tbody>
			    </table>`
    renderUI(table)
}

function idleTooltip(info) {
    return `
			Speichervorschau:
			<br />
            <span><span class='icon header wood'> </span>${info.wood.toFixed(0)}</span><br/>
            <span><span class='icon header stone'> </span>${info.stone.toFixed(0)}</span><br/>
            <span><span class='icon header iron' > </span>${info.iron.toFixed(0)}</span><br />
            <br />
            <strong>Rohstoffe um ${DSUtil.convertSecToTimeString(info.possibleAt)} </strong>
			`
}

function buildingRow(building, id) {
    const isEnough = simVillage.wood >= building.wood && simVillage.stone >= building.stone && simVillage.iron >= building.iron
    const isCEnough = simVillage.wood >= building.cWood && simVillage.stone >= building.cStone && simVillage.iron >= building.cIron
    const isPop = simVillage.pop_max() >= building.pop + simVillage.pop()
    const isStorage = simVillage.storage_max()>=Math.max(building.wood,building.stone,building.iron)
    const isCStorage = simVillage.storage_max()>=Math.max(building.cWood,building.cStone,building.cIron)
    let row = `
    <tr id="main_buildrow_main">
            <td>
                <a><img src="https://dsde.innogamescdn.com/asset/0e187870/graphic/buildings/mid/${building.name}1.png" class="bmain_list_img"></a>
                <a>${building.name}</a><br>
                <span style="font-size: 0.9em">Stufe ${building.lvl - 1}</span>
            </td>
            <td class="cost_wood"><span class="icon header wood"> </span>${building.wood}</td>
            <td class="cost_stone"><span class="icon header stone"> </span>${building.stone}</td>
            <td class="cost_iron"><span class="icon header iron"> </span>${building.iron}</td>
            <td><span class="icon header time"></span>${DSUtil.convertSecToTimeString(building.time)}</td>
            <td ${isPop ? '':'style="background: #ff00005e"'} ><span class="icon header population" > </span>${building.pop}</td>
            <td class="build_options">`
    if (isPop) {
        if (isCStorage) {
            row += `<a onclick="build('${building.id}',true)" class="btn ${(building.sumCost - building.cCost) / 64 >= 30 ? 'rtfr-btn-fix' : ''} ${isCEnough ? 'btn-bcr rtfr-green' : 'btn-btr'} float_right"
                    custom-tt="20% reduzierte Kosten:<br />
                        <strike><span class='icon header wood'> </span>${building.wood}</strike>
                        <span><span class='icon header wood'> </span>${building.cWood}</span><br/>
                        <strike><span class='icon header stone'> </span>${building.stone}</strike>
                        <span><span class='icon header stone'> </span>${building.cStone}</span><br/>
                        <strike><span class='icon header iron' > </span>${building.iron}</strike>
                        <span><span class='icon header iron' > </span>${building.cIron}</span><br />
                        <br />
                        <strong>Kostet: </strong> <span class='icon header premium'></span>30 - ${((building.sumCost - building.cCost) / 64).toFixed(2)}
		` + (isCEnough ? '' : ('<br />' + idleTooltip(simIdle(building.cWood, building.cStone, building.cIron)))) + `
					">-20%</a>`
        } else {
            row += `<a class="btn" disabled style="color:white;">Speicher<span class="icon header ressources"> </span></a>`
        }
        if (isStorage) {
        row += `
                <a class="btn ${building.sumCost <= 400 ? 'rtfr-btn-fix' : ''} ${isEnough ? 'btn-build rtfr-green' : 'btn-btr'}" onclick="build('${building.id}',false);"  
				custom-tt="${isEnough ? '' : idleTooltip(simIdle(building.wood, building.stone, building.iron))}">Stufe ${building.lvl}</a>
				`
    } else {
            row +='<a class="btn" disabled style="color:white;">Speicher<span class="icon header ressources"> </span></a>'
        }
    }
    row += `
            </td>
        </tr>`
    return row
}

function updateQueTable() {
    let queRows = ""
    let nextFin = simVillage.age
    for (let index = 0; index < buildQue.length; index++) {
        let constrObj = buildQue[index]
        let timeLeft = constrObj.time / Math.pow(2, constrObj.timesReduced)
        let timeSaved = constrObj.time - timeLeft
        nextFin += timeLeft
        queRows += `<tr class="lit nodrag buildorder_main">
		<td class="lit-item">
			<img src="https://dsde.innogamescdn.com/asset/0e187870/graphic/buildings/mid/${constrObj.name}1.png" class="bmain_list_img">
			${constrObj.name}<br>
			<span style="font-size: 0.9em">Stufe ${constrObj.lvl}</span>
		</td>
		<td class="nowrap lit-item">
			<span class="" >${DSUtil.convertSecToTimeString(timeLeft)}</span>
		</td>
		<td class="lit-item">
			<a class="order_feature btn btn-btr" onclick="reduceTime('${constrObj.id}');" style="float: left;" 
			custom-tt="Verkürzt die verbleibende Bauzeit um 50%.<br />
			<br />
			<strong>Kostet:</strong> <span class='icon header premium' title='Premium-Punkte'> </span>10">
					-50%
			</a>
		</td>
		<td class="lit-item">um ${DSUtil.convertSecToTimeString(nextFin)}  
			<a class="btn btn-xmas-steel" onclick="idle(0,0,0,${constrObj.time - constrObj.timePassed});">Fertig</a>
		</td>
		<td class="lit-item">
			<a class="btn btn-cancel" onclick="cancel('${constrObj.id}');">Abbrechen</a>
		</td>
			</tr>
		<tr class="lit">
		<td colspan="5" style="padding: 0">
			<div class="order-progress" >
				<div class="anim" data-title="" style="width: ${timeSaved / constrObj.time * 100}%; background-color: #0c260a;"></div>
				<div class="anim" data-title="" style="width: ${constrObj.timePassed / timeLeft * 100}%; background-color: rgb(146, 194, 0);"></div>
			</div>
		</td>
	</tr>`
    }
    let content = `
    <table id="build_queue" class="vis rtfr-table" style="width: 100%">
	<tbody id="buildqueue" class="ui-sortable">
	<tr>
		<th style="width: 23%">Konstruktion</th>
		<th>Dauer</th>
				<th>Beschleunigen</th>
				<th>Fertigstellung</th>
		<th style="width: 15%">Abbruch</th>
		<th style="background:none !important;"></th>	</tr>
		${queRows}
	</tbody>
	</table>
`
    jQuery('.rtfr-am-sim-que').html(buildQue.length > 0 ? content : '');
}

function buildingTempalteTable(content) {
    return `
    <table id="c_tempalte" class="vis nowrap rtfr-table" style="width: 100%;">
        <tbody>
            <tr>
                <th style="width: 23%">Gebäude</th>
                <th colspan="5">Bedarf</th>
                <th style="width: 30%">Bauen</th>
            </tr>
            ${content}
        </tbody>
    </table>
    `
}

function buildBountyTable(village) {
    if (village.bounty.length == 0) {
        return ''
    }
    const allBountys = village.bounty.reduce((a,b)=>{
        return {
            wood: a.wood + b.wood,
            stone: a.stone + b.stone,
            iron: a.iron + b.iron
        }
    }
    )
    const table = `<table class="box smallPadding" cellspacing="1" style="empty-cells:show; float:right;">
			<tbody><tr style="height: 20px;">
										<th class="">
                                        	<span>Belohnung: </span>
                                        </th>
										<th class="box-item">
											<span class="icon header wood"> </span>
										</th>
                                        <th class="box-item" style="position: relative">
                                        	<span id="wood" class="res" >${village.bounty[0].wood.toFixed(0)}</span>
                                        </th>
                                        <th class="box-item">
                                        	<span class="icon header stone"> </span>
                                        </th>
                                        <th class="box-item">
                                        	<span id="stone" class="res">${village.bounty[0].stone.toFixed(0)}</span>
                                        </th>
                                        <th class="box-item">
                                        	<span class="icon header iron"> </span>
                                        </th>
										<th class="box-item">
											<span id="iron" class="res">${village.bounty[0].iron.toFixed(0)}</span>
										</th>
                                        <th class="box-item">
                                        	<a class="btn btn-res-gems" style=" text-align: right; min-width: 60px;" onclick="claim();">Claim</a>
                                        </th>

										<th class="box-item">
                                        	<span>Alle: </span>
                                        </th>
										<th class="box-item" style="position: relative">
                                        	<span id="wood" class="res" >${allBountys.wood.toFixed(0)}</span>
                                        </th>
                                        <th class="box-item">
                                        	<span class="icon header stone"> </span>
                                        </th>
                                        <th class="box-item">
                                        	<span id="stone" class="res">${allBountys.stone.toFixed(0)}</span>
                                        </th>
                                        <th class="box-item">
                                        	<span class="icon header iron"> </span>
                                        </th>
										<th class="box-item">
											<span id="iron" class="res">${allBountys.iron.toFixed(0)}</span>
										</th>
			</tbody></table><br /><br />`
    return table
}

function updateVillageInfo(village) {
    const villageInfo = `
		<h2>AM-Simulation
			<table class="box smallPadding" cellspacing="1" style="empty-cells:show; float:right;">
			<tbody><tr style="height: 20px;">
										<th class="">
											<span class="icon header wood"> </span>
										</th>
                                        <th class="box-item" style="position: relative">
                                        	<span id="wood" class="res" >${village.wood.toFixed(0)}</span>
                                        </th>
                                        <th class="box-item">
                                        	<span class="icon header stone"> </span>
                                        </th>
                                        <th class="box-item">
                                        	<span id="stone" class="res">${village.stone.toFixed(0)}</span>
                                        </th>
                                        <th class="box-item">
                                        	<span class="icon header iron"> </span>
                                        </th>
										<th class="box-item">
											<span id="iron" class="res">${village.iron.toFixed(0)}</span>
										</th>
                                        <th class="box-item">
                                        	<a data-title="Speicherkapazität"><span class="icon header ressources"> </span></a>
                                        </th>
                                        <th class="box-item">
                                        	<span id="storage" data-title="Speicherkapazität">${village.storage_max()}</span>
                                        </th>
											<th class="box-item"><a><span class="icon header population"> </span></a></th>
											<th class="box-item" align="center" style="margin:0;padding:0;" data-title="Bauernhof">
												<span id="pop_current_label" class="">${village.pop()}</span>/<span id="pop_max_label">${village.pop_max()}</span>
											</th>
										</th>
			</tbody></table>
		</h2>
		${buildBountyTable(village)}
		<table class="box smallPadding" cellspacing="1" style="empty-cells:show; float:left;">
									<tbody><tr style="height: 20px;">
										<th class="">
											<span class="icon header time"> </span>
										</th>
										 <th class="box-item">
                                        	<span id="storage" >${DSUtil.convertSecToTimeString(village.age)}</span>
                                        </th>
										<th class="box-item">
											<span class="icon coinbag coinbag-header"> </span>
										</th>
										 <th class="box-item">
                                        	<span id="storage" >${village.ppUsed}</span>
                                        </th>
										<th class="box-item">
											<span class="icon header profile"> </span>
										</th>
										 <th class="box-item">
                                        	<span id="storage" >${village.points()}</span>
                                        </th>
		</tbody></table>
	<table class="box smallPadding" cellspacing="1" style="empty-cells:show; float:right;">
		<tbody><tr style="height: 20px;">
										<th class="">
                                        	<span>Produktion: </span>
                                        </th>
										<th class="box-item">
											<span class="icon  wood-bonus"> </span>
										</th>
                                        <th class="box-item" style="position: relative">
                                        	<span id="wood" class="res" >${(village.wood_prod() * 3600).toFixed(0)}</span>
                                        </th>
                                        <th class="box-item">
                                        	<span class="icon  stone-bonus"> </span>
                                        </th>
                                        <th class="box-item">
                                        	<span id="stone" class="res">${(village.stone_prod() * 3600).toFixed(0)}</span>
                                        </th>
                                        <th class="box-item">
                                        	<span class="icon  iron-bonus"> </span>
                                        </th>
										<th class="box-item">
											<span id="iron" class="res">${(village.iron_prod() * 3600).toFixed(0)}</span>
										</th>
	</tbody></table>
										
`
    jQuery('.rtfr-am-sim-info').html(villageInfo);
}

function renderUI(body) {
    const content = `
        <div class="rtfr-am-sim" id="rtfrVillagesInRange">
			<div class="rtfr-am-sim-info">
            </div>
			<div class="rtfr-am-sim-que">
            </div>
	        <div class="rtfr-am-sim-constr">
				${body}
            </div>
            </br>
			<div class="rtfr-am-sim-template">
            </div>
        </div>
        <style>
            /*.rtfr-am-sim { position: relative; display: block; width: auto; height: auto; clear: both; margin: 0 auto 15px; padding: 10px; border: 1px solid #603000; box-sizing: border-box; background: #f4e4bc; }*/
			.rtfr-am-sim * { box-sizing: border-box; }
			.rtfr-am-sim input[type="text"] { width: 100%; padding: 5px 10px; border: 1px solid #000; font-size: 16px; line-height: 1; }
			.rtfr-am-sim label { font-weight: 600 !important; margin-bottom: 5px; display: block; }
			.rtfr-am-sim select { width: 100%; padding: 5px 10px; border: 1px solid #000; font-size: 16px; line-height: 1; }
			.rtfr-am-sim .btn-confirm-yes { padding: 3px; }
			.rtfr-am-sim .rtfr-grid { display: grid; grid-template-columns: 180px 1fr 180px 180px; grid-gap: 0 20px; }
			/* Normal Table */
			.rtfr-table { border-collapse: separate !important; border-spacing: 2px !important; empty-cells: show !important;}
			.rtfr-table label,
			.rtfr-table input { cursor: pointer; margin: 0; }
			.rtfr-table th { font-size: 14px; }
			.rtfr-table th,
            .rtfr-table td { padding: 5px; text-align: center; }
            .rtfr-table td a { word-break: break-all; }
			.rtfr-table tr:nth-of-type(2n+1) td { background-color: #fff5da; }
			.rtfr-table a:focus:not(a.btn) { color: blue; }
			/* Popup Content */
			.rtfr-popup-content { position: relative; display: block; width: 360px; }
			.rtfr-popup-content * { box-sizing: border-box; }
			.rtfr-popup-content label { font-weight: 600 !important; margin-bottom: 5px; display: block; }
			.rtfr-popup-content textarea { width: 100%; height: 100px; resize: none; }
			/* Helpers */
			.rtfr-mb15 { margin-bottom: 15px; }
			.rtfr-mb30 { margin-bottom: 30px; }
			.rtfr-chosen-command td { background-color: #ffe563 !important; }
			.rtfr-text-left { text-align: left !important; }
			.rtfr-text-center { text-align: center !important; }
			.rtfr-unit-count { display: inline-block; margin-top: 3px; vertical-align: top; }
			.rtfr-green { color: #2fc52f; }
			/* Buttons */
			.rtfr-btn-fix.btn-bcr, .rtfr-btn-fix.btn-btr, .rtfr-btn-fix.btn-build, .rtfr-btn-fix.btn-build { background-image: url(https://dsde.innogamescdn.com/asset/0e187870/graphic/btn/buttons.png), linear-gradient( green 0%, green 22%, green 30%, green 100%) !important; }
			.box {background-color: #cbab6b; !important}
        </style>
    `;

    if (jQuery('.rtfr-am-sim').length) {
        jQuery('.rtfr-am-sim-constr').html(body);
    } else {
        jQuery('#content_value').prepend(content);
    }
    jQuery('#exportBBCodeBtn').hide();
    jQuery('#exportWorkbench').hide();
}

function initTT() {
    //Variables
    var tooltip = $('#custom_tt')
    if (tooltip.length == 0) {
        $('body').append('<div id=custom_tt class="tooltip-style"></div>')
        tooltip = $('#custom_tt')

        currentMousePos = {
            x: -1,
            y: -1
        };

        $(document).mousemove(function(event) {
            currentMousePos.x = event.pageX;
            currentMousePos.y = event.pageY;
        });
        tooltip.css({
            "z-index": "1000001"// infront of normal Tooltips
        })
    }
    //Events
    $('[custom-tt]').filter((f)=>$(f).attr('tt-active') != 'true').each((i,e)=>{
        var element = $(e)
        var displayed = false
        var content = element.attr('custom-tt')
        element.attr('tt-active', true)
        if (content.length > 0) {
            element.on("mouseenter", function(e) {})
            element.on("mousemove", function(e) {
                displayed ? calcPos(e) : tooltip.html(content),
                tooltip.show(),
                calcPos(e),
                displayed = true
                console.log("Move");
            }),
            element.on("mouseout", function() {
                tooltip.hide(),
                displayed = false;
            })
        }
    }
    )
    //Helper methods
    calcPos = function() {
        var e = [tooltip.width(), tooltip.height()]
          , a = [$(window).scrollLeft() + 3, $(window).scrollTop() + 3, $(window).scrollLeft() + $(window).width() - 3, $(window).scrollTop() + $(window).height() - 3];
        px = currentMousePos.x
        py = currentMousePos.y
        a[1] += $("#topContainer").height(),
        a[3] -= $("#footer").height(),
        py + 15 + e[1] < a[3] ? y = py + 15 : py - 15 - a[1] >= e[1] ? y = py - e[1] - 15 : y = py + 15,
        x = px + 15,
        x -= Math.max(0, x + e[0] - a[2]),
        x = Math.max(x, $(window).scrollLeft()),
        tooltip.css("left", x + "px"),
        tooltip.css("top", y + "px")
    }
}
function TT(html) {
    return 'custom-tt="' + html + '"'
}
function attrTT(element, html) {
    $(element).attr('custom-tt', html)
    return element
}
$('[id*=call_village_] td').each((i,e)=>{
    attrTT(e, e.innerText)
}
)
initTT()

function copyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = 0;
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
    } catch (err) {//console.log('Oops, unable to copy'); //optional
    }
    document.body.removeChild(textArea);
}