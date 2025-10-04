// James Webb Space Telescope Image Collection
const jwstImages = [
    {
        id: 'deep-field',
        title: 'Webb\'s First Deep Field',
        description: 'Galaxy cluster SMACS 0723, thousands of galaxies in a tiny sliver of the universe',
        url: 'images/jwst/deep-field.jpg',
        thumbnail: 'images/jwst/deep-field.jpg',
        remoteUrl: 'https://stsci-opo.org/STScI-01G7JJADTH90FR98AKKJFKSS0B.png',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2022-07-11',
        tags: ['deep field', 'galaxies', 'gravitational lensing']
    },
    {
        id: 'carina-nebula',
        title: 'Cosmic Cliffs in Carina Nebula',
        description: 'Star-forming region NGC 3324 at the edge of the Carina Nebula',
        url: 'images/jwst/carina-nebula.jpg',
        thumbnail: 'images/jwst/carina-nebula.jpg',
        remoteUrl: 'https://stsci-opo.org/STScI-01G7DCWB7137MYJ05CSH1Q5Z1Z.png',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2022-07-12',
        tags: ['nebula', 'star formation', 'carina']
    },
    {
        id: 'southern-ring',
        title: 'Southern Ring Nebula',
        description: 'Planetary nebula NGC 3132, showcasing shells of gas and dust',
        url: 'images/jwst/southern-ring.jpg',
        thumbnail: 'images/jwst/southern-ring.jpg',
        remoteUrl: 'https://stsci-opo.org/STScI-01G7DA5ADA2WDSK1JJPQ0PTG4A.png',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2022-07-12',
        tags: ['nebula', 'planetary nebula']
    },
    {
        id: 'stephans-quintet',
        title: 'Stephan\'s Quintet',
        description: 'Compact galaxy group with five galaxies locked in a cosmic dance',
        url: 'images/jwst/stephans-quintet.jpg',
        thumbnail: 'images/jwst/stephans-quintet.jpg',
        remoteUrl: 'https://stsci-opo.org/STScI-01G7DB1FHPMJCCY59CQGZC1YJQ.png',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2022-07-12',
        tags: ['galaxies', 'galaxy group', 'interaction']
    },
    {
        id: 'tarantula-nebula',
        title: 'Tarantula Nebula',
        description: 'Star-forming region in the Large Magellanic Cloud',
        url: 'images/jwst/tarantula-nebula.jpg',
        thumbnail: 'images/jwst/tarantula-nebula.jpg',
        remoteUrl: 'https://stsci-opo.org/STScI-01GA76Q01D09HFEV174SVMQDMV.png',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2022-09-06',
        tags: ['nebula', 'star formation', 'LMC']
    },
    {
        id: 'cartwheel-galaxy',
        title: 'Cartwheel Galaxy',
        description: 'Ring galaxy formed by a high-speed collision',
        url: 'images/jwst/cartwheel-galaxy.jpg',
        thumbnail: 'images/jwst/cartwheel-galaxy.jpg',
        remoteUrl: 'https://stsci-opo.org/STScI-01G9G4E4RXQRQV9KXQG4MYS19M.png',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2022-08-02',
        tags: ['galaxy', 'ring galaxy', 'collision']
    },
    {
        id: 'pillars-creation',
        title: 'Pillars of Creation',
        description: 'Iconic star-forming region in the Eagle Nebula',
        url: 'images/jwst/pillars-creation.jpg',
        thumbnail: 'images/jwst/pillars-creation.jpg',
        remoteUrl: 'https://stsci-opo.org/STScI-01GF44EV7PH4FVGNG9KMWS8HCR.png',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2022-10-19',
        tags: ['nebula', 'pillars', 'star formation', 'eagle nebula']
    },
    {
        id: 'orion-nebula',
        title: 'Orion Nebula',
        description: 'Stellar nursery in the constellation Orion',
        url: 'images/jwst/orion-nebula.jpg',
        thumbnail: 'images/jwst/orion-nebula.jpg',
        remoteUrl: 'https://stsci-opo.org/STScI-01GFN4VB46C7YDP38VH0MJZS40.png',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2022-09-12',
        tags: ['nebula', 'orion', 'star formation']
    },
    {
        id: 'rho-ophiuchi',
        title: 'Rho Ophiuchi Cloud Complex',
        description: 'Closest star-forming region to Earth',
        url: 'images/jwst/rho-ophiuchi.jpg',
        thumbnail: 'images/jwst/rho-ophiuchi.jpg',
        remoteUrl: 'https://stsci-opo.org/STScI-01H44AY5HBXZ8QSTDG5M9CSPSK.png',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2023-07-12',
        tags: ['nebula', 'star formation', 'rho ophiuchi']
    },
    {
        id: 'ring-nebula',
        title: 'Ring Nebula M57',
        description: 'Planetary nebula with intricate details of a dying star',
        url: 'images/jwst/ring-nebula.jpg',
        thumbnail: 'images/jwst/ring-nebula.jpg',
        remoteUrl: 'https://stsci-opo.org/STScI-01H9RGERBA7MZRQ7B8XWQCMCV4.png',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2023-08-21',
        tags: ['nebula', 'planetary nebula', 'ring']
    }
];

// Unsplash space collections for additional variety
const unsplashCollections = {
    space: '964475',  // Space collection
    nasa: '2102316',  // NASA collection
    astronomy: '827963'  // Astronomy collection
};

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { jwstImages, unsplashCollections };
}