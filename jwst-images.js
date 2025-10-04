// James Webb Space Telescope Image Collection - Updated with actual NASA Flickr images
const jwstImages = [
    {
        id: 'phantom-galaxy',
        title: 'Phantom Galaxy (M74)',
        description: 'Webb captures stellar nurseries and star clusters in the Phantom Galaxy',
        url: 'images/jwst-optimized/54692963181_e9ddaf3294_o.jpg',
        thumbnail: 'images/jwst-optimized/54692963181_e9ddaf3294_o.jpg',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2024-11-29',
        tags: ['galaxy', 'spiral galaxy', 'M74']
    },
    {
        id: 'sombrero-galaxy',
        title: 'Sombrero Galaxy (M104)',
        description: 'Webb reveals the Sombrero Galaxy in stunning infrared detail',
        url: 'images/jwst-optimized/54688092157_efd8cef20a_o.jpg',
        thumbnail: 'images/jwst-optimized/54688092157_efd8cef20a_o.jpg',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2024-11-25',
        tags: ['galaxy', 'sombrero', 'M104']
    },
    {
        id: 'crab-nebula',
        title: 'Crab Nebula',
        description: 'Webb explores the aftermath of a stellar explosion',
        url: 'images/jwst-optimized/54644815047_f6aaedf588_o.jpg',
        thumbnail: 'images/jwst-optimized/54644815047_f6aaedf588_o.jpg',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2024-11-04',
        tags: ['nebula', 'supernova remnant', 'pulsar']
    },
    {
        id: 'serpens-nebula',
        title: 'Serpens Nebula',
        description: 'Aligned protostellar outflows in the Serpens Nebula',
        url: 'images/jwst-optimized/54639970389_dfbc0c75f6_o.jpg',
        thumbnail: 'images/jwst-optimized/54639970389_dfbc0c75f6_o.jpg',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2024-11-01',
        tags: ['nebula', 'star formation', 'protostars']
    },
    {
        id: 'lensed-galaxies',
        title: 'Gravitationally Lensed Galaxies',
        description: 'Webb reveals distant galaxies through gravitational lensing',
        url: 'images/jwst-optimized/54626159771_b9d4f2ea0f_o.jpg',
        thumbnail: 'images/jwst-optimized/54626159771_b9d4f2ea0f_o.jpg',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2024-10-28',
        tags: ['galaxies', 'gravitational lensing', 'deep field']
    },
    {
        id: 'spiral-galaxy-ic5332',
        title: 'Spiral Galaxy IC 5332',
        description: 'Face-on spiral galaxy in unprecedented detail',
        url: 'images/jwst-optimized/54565613170_7e8bef5479_o.jpg',
        thumbnail: 'images/jwst-optimized/54565613170_7e8bef5479_o.jpg',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2024-10-01',
        tags: ['galaxy', 'spiral', 'IC 5332']
    },
    {
        id: 'arp-107',
        title: 'Arp 107 Colliding Galaxies',
        description: 'Two galaxies in the process of merging',
        url: 'images/jwst-optimized/54213487373_132699b1df_o.jpg',
        thumbnail: 'images/jwst-optimized/54213487373_132699b1df_o.jpg',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2024-09-24',
        tags: ['galaxies', 'collision', 'Arp 107']
    },
    {
        id: 'penguin-egg-galaxies',
        title: 'Penguin and Egg Galaxies',
        description: 'Interacting galaxies resembling a penguin guarding an egg',
        url: 'images/jwst-optimized/54167157727_9c8df56be1_o.jpg',
        thumbnail: 'images/jwst-optimized/54167157727_9c8df56be1_o.jpg',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2024-07-12',
        tags: ['galaxies', 'interacting', 'Arp 142']
    },
    {
        id: 'cosmic-seahorse',
        title: 'Cosmic Seahorse',
        description: 'A distant galaxy distorted by gravitational lensing',
        url: 'images/jwst-optimized/54107470055_7387a886d1_o.jpg',
        thumbnail: 'images/jwst-optimized/54107470055_7387a886d1_o.jpg',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2024-06-24',
        tags: ['galaxy', 'gravitational lensing', 'distant']
    },
    {
        id: 'ngc-6440',
        title: 'Globular Cluster NGC 6440',
        description: 'Ancient stellar city packed with hundreds of thousands of stars',
        url: 'images/jwst-optimized/54107357754_d57a5943c5_o.jpg',
        thumbnail: 'images/jwst-optimized/54107357754_d57a5943c5_o.jpg',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2024-06-24',
        tags: ['star cluster', 'globular cluster', 'NGC 6440']
    },
    {
        id: 'protostar-herbig-haro',
        title: 'Herbig-Haro 211',
        description: 'Outflows from a young protostar',
        url: 'images/jwst-optimized/54088897300_3e378b6a5f_o.jpg',
        thumbnail: 'images/jwst-optimized/54088897300_3e378b6a5f_o.jpg',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2024-06-14',
        tags: ['protostar', 'Herbig-Haro', 'star formation']
    },
    {
        id: 'quasar-rx-j1131',
        title: 'Quasar RX J1131-1231',
        description: 'A distant quasar lensed by a foreground galaxy',
        url: 'images/jwst-optimized/53951942710_9389759151_o.jpg',
        thumbnail: 'images/jwst-optimized/53951942710_9389759151_o.jpg',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2024-05-13',
        tags: ['quasar', 'black hole', 'gravitational lensing']
    },
    {
        id: 'ngc-604',
        title: 'Star-Forming Region NGC 604',
        description: 'Stellar nursery in the Triangulum Galaxy',
        url: 'images/jwst-optimized/53876484333_958b3c2c84_o.jpg',
        thumbnail: 'images/jwst-optimized/53876484333_958b3c2c84_o.jpg',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2024-04-29',
        tags: ['nebula', 'star formation', 'NGC 604']
    },
    {
        id: 'messier-82',
        title: 'Starburst Galaxy M82',
        description: 'Cigar Galaxy undergoing intense star formation',
        url: 'images/jwst-optimized/53876176351_9cbdfa7df1_o.jpg',
        thumbnail: 'images/jwst-optimized/53876176351_9cbdfa7df1_o.jpg',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2024-04-29',
        tags: ['galaxy', 'starburst', 'M82']
    },
    {
        id: 'ngc-3256',
        title: 'Peculiar Galaxy NGC 3256',
        description: 'The aftermath of a galactic collision',
        url: 'images/jwst-optimized/53612916394_734d0e1e4a_o.jpg',
        thumbnail: 'images/jwst-optimized/53612916394_734d0e1e4a_o.jpg',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2024-04-01',
        tags: ['galaxy', 'merger', 'NGC 3256']
    },
    {
        id: 'tarantula-nebula',
        title: 'Tarantula Nebula',
        description: 'Star-forming region in the Large Magellanic Cloud',
        url: 'images/jwst-optimized/tarantula-nebula.jpg',
        thumbnail: 'images/jwst-optimized/tarantula-nebula.jpg',
        credit: 'NASA, ESA, CSA, STScI',
        date: '2022-09-06',
        tags: ['nebula', 'star formation', 'LMC']
    }
];

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { jwstImages };
}