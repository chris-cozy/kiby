const media = require('../schemas/media');

/**
 * @brief Store kirby media in database
 */
module.exports = async () => {

    const stored = [
        {
            type: "play",
            name: "kirbyOnComputer.png",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/kirbyOnComputer.png",
        },
        {
            type: "portrait",
            name: "kirbyOnStar.png",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/kirbyOnStar.png",
        },
        {
            type: "play",
            name: "kirbyPlayingSwitch.png",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/kirbyPlayingSwitch.png",
        },
        {
            type: "portrait",
            name: "kirbyUnderHeart.png",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/kirbyUnderHeart.png",
        },
        {
            type: "portrait",
            name: "kirbyUnderHeart2.png",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/kirbyUnderHeart2.png",
        },
        {
            type: "portrait",
            name: "pileOfKirbys.png",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/pileOfKirbys.png",
        },
        {
            type: "portrait",
            name: "swimmingKirby.png",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/swimmingKirby.png",
        },
        {
            type: "angry",
            name: "angryKirby.png",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/angryKirby.png",
        },
        {
            type: "play",
            name: "artistKirby.png",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/artistKirby.png",
        },
        {
            type: "portrait",
            name: "beanieKirby.png",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/beanieKirby.png",
        },
        {
            type: "hungry",
            name: "droolingKirby.png",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/droolingKirby.png",
        },
        {
            type: "hungry",
            name: "kirbyDreamingOfFood.png",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/kirbyDreamingOfFood.png",
        },
        {
            type: "portrait",
            name: "kirbyFloating.png",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/kirbyFloating.png",
        },
        {
            type: "play",
            name: "kirbyLayingOnNotebook.png",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/kirbyLayingOnNotebook.png",
        },
    ]

    const waiting = [

    ]

    await media.insertMany([

    ]);


}