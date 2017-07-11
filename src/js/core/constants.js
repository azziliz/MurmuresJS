/**
 * @file Constants. Part of the MurmuresJS project.
 * @author github.com/azziliz
 * @author github.com/thyshimrod
 * {@link https://github.com/azziliz/MurmuresJS/ Project page}
 * @license MIT
 */

'use strict';
//debugger;


murmures.C = Object.freeze({
    SQUARE_TILES_LAYOUT : 'square',
    HEX_TILES_LAYOUT : 'hex',
    
    DEFAULT_RANGE_FOV : 10,
    
    /*
     * visibility of a tile
     */
    TILE_NOT_DISCOVERED: 0,
    TILE_HIGHLIGHTED: 1,
    TILE_FOG_OF_WAR: 2,
    
    /*
     * environments
     */
    ENVIRONMENT_FLYING: 0,
    ENVIRONMENT_TERRESTRIAL: 1,
    ENVIRONMENT_AQUATIC: 2,
    ENVIRONMENT_UNDERGROUND: 3,
    ENVIRONMENT_ETHEREAL: 4,
    
    /*
     * skill target audience
     */
    TARGET_AUDIENCE_ALL: 0,
    TARGET_AUDIENCE_HERO: 1,
    TARGET_AUDIENCE_MOB: 2,
    
    /*
     * state engine constants
     */
    STATE_ENGINE_INIT: 0,
    STATE_ENGINE_PLAYER_REGISTERED: 1,
    STATE_ENGINE_PLAYING: 2,
    STATE_ENGINE_DEATH: 3,
    
    /* Format:
     * 'layerId' : ['layerName','TileGroup']
     */
    LAYERS: {
        '00': ['Debug', ''],
        '01': ['Floor', 'groundId'],
        '02': ['Floordeco', 'groundDeco'],
        '03': ['Trap', 'groundDeco'],
        '04': ['Marks', 'groundDeco'],
        '06': ['Wall', 'groundId'],
        '07': ['Walldeco', 'groundDeco'],
        '11': ['Stairs', 'propId'],
        '12': ['Gate', 'propId'],
        '13': ['Altar', 'propId'],
        '14': ['Chest', 'propId'],
        '15': ['Propmisc', 'propId'],
        '21': ['Book', ''],
        '22': ['Scroll', ''],
        '23': ['Potion', ''],
        '24': ['Rune', ''],
        '25': ['Itemmisc', 'itemId'],
        '26': ['Food', ''],
        '27': ['Crafting', ''],
        '31': ['Aberrations', 'charId'],
        '32': ['Beasts', 'charId'],
        '33': ['Celestials', 'charId'],
        '34': ['Constructs', 'charId'],
        '35': ['Dragons', 'charId'],
        '36': ['Elemental', 'charId'],
        '37': ['Fey', 'charId'],
        '38': ['Fiends', 'charId'],
        '39': ['Giants', 'charId'],
        '40': ['Humanoids', 'charId'],
        '41': ['Monstrosities', 'charId'],
        '42': ['Oozes', 'charId'],
        '43': ['Plants', 'charId'],
        '44': ['Undead', 'charId'],
        '56': ['Hero', 'charId'],
        '60': ['Playerbase', ''],
        '61': ['Playerhair', ''],
        '62': ['Playerbeard', ''],
        '63': ['Playerbody', ''],
        '64': ['Playerlegs', ''],
        '65': ['Playerboots', ''],
        '66': ['Playergloves', ''],
        '67': ['Playerhand1', ''],
        '68': ['Playerhand2', ''],
        '69': ['Playerhead', ''],
        '70': ['Playercloak', ''],
        '74': ['Amulet', ''],
        '75': ['Ring', ''],
        '76': ['Weaponmagic', ''],
        '77': ['Weaponmelee', ''],
        '78': ['Weaponranged', ''],
        '79': ['Shield', ''],
        '81': ['Armor', ''],
        '82': ['Boots', ''],
        '83': ['Gloves', ''],
        '84': ['Headgear', ''],
        '85': ['Cloak', ''],
        '86': ['Robe', ''],
        '91': ['Ui', ''],
        '92': ['Effects', ''],
        '93': ['Spellicon', ''],
        '95': ['Icons', ''],
    },
});
