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
    ]

    const waiting = [
        {
            type: "angry",
            name: "angryKirby.jfif",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/angryKirby.jfif",
        },
        {
            type: "play",
            name: "artistKirby.jfif",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/artistKirby.jfif",
        },
        {
            type: "portrait",
            name: "beanieKirby.jfif",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/beanieKirby.jfif",
        },
        {
            type: "hungry",
            name: "droolingKirby.jfif",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/droolingKirby.jfif",
        },
        {
            type: "hungry",
            name: "kirbyDreamingOfFood.jfif",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/kirbyDreamingOfFood.jfif",
        },
        {
            type: "portrait",
            name: "kirbyFloating.jfif",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/kirbyFloating.jfif",
        },
        {
            type: "play",
            name: "kirbyLayingOnNotebook.jfif",
            url: "C:/Users/cjsan/Documents/Code/Projects/discord/Kiby/src/media/kirbyLayingOnNotebook.jfif",
        },
    ]

    await media.insertMany([

    ]);


}