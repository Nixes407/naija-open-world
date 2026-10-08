export const ORIGINS = {

  ajebutter: {

    id:'ajebutter', name:'Ajebutter',

    description:'Rich kid from Lekki. Silver spoon, zero street sense.',

    emoji:'🏠', startMoney:5000000,

    stats:{health:100,energy:100,sanity:80,

           reputation:60,streetCred:10,education:80},

    startArea:'Lekki', difficulty:'Easy',

    color:'#FFD700',

    autoLook:{hair:'low-cut',hairColor:'#1a1a1a',

              beard:'clean',clothes:'designer',

              shoes:'loafers',accessory:'gold-chain'},

    allowedClothes:['designer','suit','smart-casual','ankara'],

    allowedShoes:['loafers','dress-shoes','trainers','sneakers'],

    allowedHairColors:['#1a1a1a','#4a3728','#8B6914',

                       '#FFD700','#888888','#e74c3c'],

  },

  ajepako: {

    id:'ajepako', name:'Ajepako',

    description:'Street smart hustler from Mushin. Knows every corner.',

    emoji:'💪', startMoney:50000,

    stats:{health:90,energy:95,sanity:70,

           reputation:40,streetCred:90,education:30},

    startArea:'Mushin', difficulty:'Hard',

    color:'#FF6B35',

    autoLook:{hair:'fade',hairColor:'#1a1a1a',

              beard:'stubble',clothes:'streetwear',

              shoes:'trainers',accessory:'durag'},

    allowedClothes:['streetwear','ankara','simple'],

    allowedShoes:['trainers','slippers','sandals'],

    allowedHairColors:['#1a1a1a','#4a3728'],

  },

  jjc: {

    id:'jjc', name:'JJC',

    description:'Just landed from abroad. Big dreams, culture shock loading.',

    emoji:'✈️', startMoney:200000,

    stats:{health:100,energy:100,sanity:60,

           reputation:30,streetCred:5,education:90},

    startArea:'Ikeja', difficulty:'Medium',

    color:'#4FC3F7',

    autoLook:{hair:'waves',hairColor:'#1a1a1a',

              beard:'clean',clothes:'foreign-brand',

              shoes:'sneakers',accessory:'abroad-jacket'},

    allowedClothes:['foreign-brand','smart-casual','designer'],

    allowedShoes:['sneakers','trainers','loafers'],

    allowedHairColors:['#1a1a1a','#4a3728','#8B6914',

                       '#888888','#FFD700','#e74c3c'],

  },

  village: {

    id:'village', name:'Village Champion',

    description:'Arriving from the village with big ambitions.',

    emoji:'🌿', startMoney:15000,

    stats:{health:100,energy:100,sanity:90,

           reputation:20,streetCred:40,education:20},

    startArea:'Oshodi', difficulty:'Very Hard',

    color:'#2ECC71',

    autoLook:{hair:'low-cut',hairColor:'#1a1a1a',

              beard:'full-beard',clothes:'agbada',

              shoes:'slippers',accessory:'none'},

    allowedClothes:['agbada','ankara','simple'],

    allowedShoes:['slippers','sandals'],

    allowedHairColors:['#1a1a1a','#4a3728'],

  },

  returnee: {

    id:'returnee', name:'Returnee',

    description:'Back from diaspora. Dollar savings, naira problems.',

    emoji:'🌍', startMoney:800000,

    stats:{health:100,energy:90,sanity:75,

           reputation:50,streetCred:15,education:85},

    startArea:'VI', difficulty:'Medium',

    color:'#9B59B6',

    autoLook:{hair:'low-cut',hairColor:'#1a1a1a',

              beard:'goatee',clothes:'smart-casual',

              shoes:'loafers',accessory:'foreign-watch'},

    allowedClothes:['smart-casual','suit','foreign-brand'],

    allowedShoes:['loafers','dress-shoes','sneakers'],

    allowedHairColors:['#1a1a1a','#4a3728','#8B6914',

                       '#888888','#FFD700','#e74c3c'],

  },

};



export const SKIN_TONES = [

  {id:'tone1',color:'#FDDBB4',label:'Light'},

  {id:'tone2',color:'#D4956A',label:'Medium'},

  {id:'tone3',color:'#8D5524',label:'Brown'},

  {id:'tone4',color:'#4A2912',label:'Dark'},

  {id:'tone5',color:'#2C1A0E',label:'Deepest'},

];



export const HAIR_STYLES = [

  {id:'low-cut',label:'Low Cut'},

  {id:'fade',label:'Fade'},

  {id:'afro',label:'Afro'},

  {id:'dreadlocks',label:'Dreadlocks'},

  {id:'waves',label:'Waves'},

  {id:'bald',label:'Bald'},

  {id:'braids',label:'Braids'},

];



export const BEARD_STYLES = [

  {id:'clean',label:'Clean Shave'},

  {id:'stubble',label:'Stubble'},

  {id:'goatee',label:'Goatee'},

  {id:'full-beard',label:'Full Beard'},

];



export const CLOTHES_OPTIONS = [

  {id:'designer',label:'Designer Wear'},

  {id:'suit',label:'Suit'},

  {id:'smart-casual',label:'Smart Casual'},

  {id:'streetwear',label:'Street Wear'},

  {id:'foreign-brand',label:'Foreign Brand'},

  {id:'ankara',label:'Ankara'},

  {id:'agbada',label:'Agbada'},

  {id:'simple',label:'Simple Wear'},

];



export const SHOES_OPTIONS = [

  {id:'loafers',label:'Loafers'},

  {id:'dress-shoes',label:'Dress Shoes'},

  {id:'trainers',label:'Trainers'},

  {id:'sneakers',label:'Sneakers'},

  {id:'slippers',label:'Slippers'},

  {id:'sandals',label:'Sandals'},

  {id:'crocs',label:'Crocs'},

  {id:'boots',label:'Boots'},

];



// Class will be added in next prompt

export default class CharacterCreator {

  constructor() {}

  open() {

    return new Promise(resolve => {

      this._resolve = resolve;

    });

  }

  destroy() {}

}
