export type EntryType = "movie" | "show" | "netflix";

export type FontKey =
  | "anton"
  | "bebas"
  | "bangers"
  | "russo"
  | "blackops"
  | "cinzel"
  | "creepster"
  | "orbitron"
  | "monoton";

export interface WordmarkStyle {
  font: FontKey;
  /** CSS background-image used as the text fill */
  gradient: string;
  /** signature color used for hover aura, flash + confetti */
  aura: string;
  /** per-letter font chaos (Loki) */
  chaos?: boolean;
  /** relative size tweak, 1 = default */
  scale?: number;
}

export interface Entry {
  id: string;
  title: string;
  /** small kicker line shown above the wordmark, like the poster ("THE INCREDIBLE") */
  sub?: string;
  year: number;
  type: EntryType;
  mediaType: "movie" | "tv";
  tmdbId?: number;
  /** in-universe chronological position (movies only) */
  chrono?: number;
  /** MCU phase (movies only) — used for the divider banners */
  phase?: number;
  /** Disney+ series that sets up Doomsday — can be slotted into the movie trail */
  keySeries?: KeySeries;
  wm: WordmarkStyle;
}

export interface KeySeries {
  /** one line on why it matters for Doomsday */
  why: string;
  /** id of the entry it follows in release order */
  after: string;
  /** id of the entry it follows in in-universe order */
  chronoAfter: string;
}

/** Avengers: Doomsday theatrical release */
export const DOOMSDAY_DATE = "2026-12-18T00:00:00";

const metallicGold = "linear-gradient(180deg,#fff8e0 0%,#e8b64c 45%,#8a5a1a 75%,#e8b64c 100%)";
const hotRod = "linear-gradient(180deg,#ffd9a0 0%,#ff3b2f 40%,#7a0d08 80%,#c22218 100%)";
const steel = "linear-gradient(180deg,#ffffff 0%,#b8c4d4 40%,#5a6a80 70%,#9fb0c4 100%)";
const darkSteel = "linear-gradient(180deg,#cfd8e4 0%,#7d8ba0 45%,#39414f 80%,#6b7688 100%)";
const gammaGreen = "linear-gradient(180deg,#d8ffd0 0%,#4ed13c 45%,#1c6412 80%,#3aa32c 100%)";
const capBlue = "linear-gradient(180deg,#e8f2ff 0%,#7fb3e8 40%,#1c4f8a 75%,#4d84c4 100%)";
const pantherPurple = "linear-gradient(180deg,#f0e8ff 0%,#9a6cf0 45%,#3d2178 80%,#7a52d4 100%)";
const mysticOrange = "linear-gradient(180deg,#ffe9c4 0%,#f0a030 45%,#8a3d0a 78%,#d4762a 100%)";
const cosmicBlue = "linear-gradient(180deg,#e0f4ff 0%,#5ac8f0 45%,#1a4a8a 80%,#3a8ad4 100%)";
const neonSunset = "linear-gradient(180deg,#ffe95e 0%,#ff9040 35%,#f03e8a 70%,#8a2bd4 100%)";
const marvelRed = "linear-gradient(180deg,#ffd4d0 0%,#ec1d24 50%,#7a0a0e 85%,#c01218 100%)";
const widowCrimson = "linear-gradient(180deg,#ffffff 0%,#d8dde4 35%,#c01824 70%,#5a070c 100%)";
const shangGold = "linear-gradient(180deg,#fff2c8 0%,#f0c040 40%,#a04818 75%,#e0a030 100%)";
const celestialGold = "linear-gradient(180deg,#fffbe8 0%,#ead9a0 45%,#8a7440 78%,#cdb878 100%)";
const quantum = "linear-gradient(180deg,#ffe0f8 0%,#f060d0 40%,#6020c0 75%,#b040e8 100%)";
const doomGreen = "linear-gradient(180deg,#eafff0 0%,#3dff6e 45%,#0d5a26 80%,#2bd456 100%)";
const deadpool = "linear-gradient(90deg,#ff2020 0%,#ff2020 46%,#ffd82a 54%,#ffd82a 100%)";
const spidey = "linear-gradient(180deg,#ffd4d0 0%,#e82c2c 45%,#1a3a8a 90%)";
const jessicaPurple = "linear-gradient(180deg,#f0e0ff 0%,#b060e8 45%,#4a1a80 80%,#8a3ad4 100%)";
const cageYellow = "linear-gradient(180deg,#fff8d0 0%,#f0c828 45%,#8a6a10 80%,#d4a820 100%)";
const fistGreen = "linear-gradient(180deg,#e8ffe8 0%,#50c878 45%,#14502a 80%,#38a058 100%)";
const punisherBone = "linear-gradient(180deg,#ffffff 0%,#d0d0d0 45%,#606060 80%,#a8a8a8 100%)";
const wandaCrimson = "linear-gradient(180deg,#ffd0d8 0%,#e83050 45%,#6a0818 80%,#c02040 100%)";
const msMarvelPop = "linear-gradient(180deg,#fff0c0 0%,#f0b028 40%,#c03050 75%,#e05038 100%)";
const moonWhite = "linear-gradient(180deg,#ffffff 0%,#e8ecf4 40%,#8a94a8 75%,#c8d0e0 100%)";
const agathaViolet = "linear-gradient(180deg,#f4e8ff 0%,#b478e8 45%,#41155f 80%,#8a48c4 100%)";
const wonderGreen = "linear-gradient(180deg,#e8ffe0 0%,#78d858 45%,#a03828 90%)";
const visionGold = "linear-gradient(180deg,#fff8e8 0%,#e8cc88 45%,#8a4838 80%,#d4a868 100%)";

/**
 * Board order matches the poster: movies in release order (the recommended
 * first-watch order), shows as a side-quest column.  `chrono` re-sorts the
 * movies into in-universe order for the toggle.
 */
export const TIMELINE: Entry[] = [
  // ------------------------------------------------------------------
  // MOVIES — release order, ending at Doomsday
  // ------------------------------------------------------------------
  { id: "iron-man", title: "Iron Man", year: 2008, type: "movie", mediaType: "movie", tmdbId: 1726, chrono: 3, phase: 1, wm: { font: "russo", gradient: metallicGold, aura: "#e8b64c" } },
  { id: "incredible-hulk", title: "Hulk", sub: "The Incredible", year: 2008, type: "movie", mediaType: "movie", tmdbId: 1724, chrono: 5, phase: 1, wm: { font: "creepster", gradient: gammaGreen, aura: "#4ed13c", scale: 1.15 } },
  { id: "iron-man-2", title: "Iron Man 2", year: 2010, type: "movie", mediaType: "movie", tmdbId: 10138, chrono: 4, phase: 1, wm: { font: "russo", gradient: hotRod, aura: "#ff3b2f" } },
  { id: "thor", title: "Thor", year: 2011, type: "movie", mediaType: "movie", tmdbId: 10195, chrono: 6, phase: 1, wm: { font: "cinzel", gradient: steel, aura: "#b8c4d4", scale: 1.1 } },
  { id: "captain-america-1", title: "Captain America", sub: "The First Avenger", year: 2011, type: "movie", mediaType: "movie", tmdbId: 1771, chrono: 1, phase: 1, wm: { font: "blackops", gradient: capBlue, aura: "#7fb3e8", scale: 0.82 } },
  { id: "avengers", title: "The Avengers", year: 2012, type: "movie", mediaType: "movie", tmdbId: 24428, chrono: 7, phase: 1, wm: { font: "anton", gradient: steel, aura: "#e8e8e8" } },

  { id: "iron-man-3", title: "Iron Man 3", year: 2013, type: "movie", mediaType: "movie", tmdbId: 68721, chrono: 8, phase: 2, wm: { font: "russo", gradient: metallicGold, aura: "#e8b64c" } },
  { id: "thor-dark-world", title: "Thor", sub: "The Dark World", year: 2013, type: "movie", mediaType: "movie", tmdbId: 76338, chrono: 9, phase: 2, wm: { font: "cinzel", gradient: darkSteel, aura: "#7d8ba0", scale: 1.1 } },
  { id: "captain-america-2", title: "Captain America", sub: "The Winter Soldier", year: 2014, type: "movie", mediaType: "movie", tmdbId: 100402, chrono: 10, phase: 2, wm: { font: "blackops", gradient: darkSteel, aura: "#8fa8c8", scale: 0.82 } },
  { id: "guardians", title: "Guardians of the Galaxy", year: 2014, type: "movie", mediaType: "movie", tmdbId: 118340, chrono: 11, phase: 2, wm: { font: "bangers", gradient: neonSunset, aura: "#f03e8a", scale: 0.9 } },
  { id: "age-of-ultron", title: "Avengers", sub: "Age of Ultron", year: 2015, type: "movie", mediaType: "movie", tmdbId: 99861, chrono: 13, phase: 2, wm: { font: "anton", gradient: steel, aura: "#e8e8e8" } },
  { id: "ant-man", title: "Ant-Man", year: 2015, type: "movie", mediaType: "movie", tmdbId: 102899, chrono: 14, phase: 2, wm: { font: "russo", gradient: widowCrimson, aura: "#e04858" } },

  { id: "civil-war", title: "Civil War", sub: "Captain America", year: 2016, type: "movie", mediaType: "movie", tmdbId: 271110, chrono: 15, phase: 3, wm: { font: "blackops", gradient: "linear-gradient(90deg,#7fb3e8 0%,#3a6ab0 45%,#c02030 55%,#ff5040 100%)", aura: "#c04058", scale: 0.92 } },
  { id: "doctor-strange", title: "Doctor Strange", year: 2016, type: "movie", mediaType: "movie", tmdbId: 284052, chrono: 19, phase: 3, wm: { font: "cinzel", gradient: mysticOrange, aura: "#f0a030", scale: 0.85 } },
  { id: "guardians-2", title: "Guardians Vol. 2", sub: "of the Galaxy", year: 2017, type: "movie", mediaType: "movie", tmdbId: 283995, chrono: 12, phase: 3, wm: { font: "bangers", gradient: neonSunset, aura: "#ff9040", scale: 0.9 } },
  { id: "homecoming", title: "Spider-Man", sub: "Homecoming", year: 2017, type: "movie", mediaType: "movie", tmdbId: 315635, chrono: 17, phase: 3, wm: { font: "bebas", gradient: spidey, aura: "#e82c2c" } },
  { id: "ragnarok", title: "Thor", sub: "Ragnarok", year: 2017, type: "movie", mediaType: "movie", tmdbId: 284053, chrono: 20, phase: 3, wm: { font: "bebas", gradient: "linear-gradient(180deg,#fff05e 0%,#40e0d0 50%,#f03e8a 100%)", aura: "#40e0d0", scale: 1.1 } },
  { id: "black-panther", title: "Black Panther", year: 2018, type: "movie", mediaType: "movie", tmdbId: 284054, chrono: 18, phase: 3, wm: { font: "anton", gradient: pantherPurple, aura: "#9a6cf0" } },
  { id: "infinity-war", title: "Avengers", sub: "Infinity War", year: 2018, type: "movie", mediaType: "movie", tmdbId: 299536, chrono: 22, phase: 3, wm: { font: "anton", gradient: "linear-gradient(180deg,#ffd9a0 0%,#f0a030 40%,#8a2bd4 100%)", aura: "#c46ae8" } },
  { id: "ant-man-2", title: "Ant-Man & The Wasp", year: 2018, type: "movie", mediaType: "movie", tmdbId: 363088, chrono: 21, phase: 3, wm: { font: "russo", gradient: "linear-gradient(180deg,#ffd9a0 0%,#e04858 55%,#f0c040 100%)", aura: "#f0c040", scale: 0.85 } },
  { id: "captain-marvel", title: "Captain Marvel", year: 2019, type: "movie", mediaType: "movie", tmdbId: 299537, chrono: 2, phase: 3, wm: { font: "orbitron", gradient: "linear-gradient(180deg,#fff2c8 0%,#f0c040 35%,#c02030 70%,#3a6ab0 100%)", aura: "#f0c040", scale: 0.85 } },
  { id: "endgame", title: "Avengers", sub: "Endgame", year: 2019, type: "movie", mediaType: "movie", tmdbId: 299534, chrono: 23, phase: 3, wm: { font: "anton", gradient: "linear-gradient(180deg,#ffffff 0%,#d0d0d8 40%,#c01824 100%)", aura: "#e8e8e8" } },
  { id: "far-from-home", title: "Spider-Man", sub: "Far From Home", year: 2019, type: "movie", mediaType: "movie", tmdbId: 429617, chrono: 24, phase: 3, wm: { font: "bebas", gradient: spidey, aura: "#e82c2c" } },

  { id: "black-widow", title: "Black Widow", year: 2021, type: "movie", mediaType: "movie", tmdbId: 497698, chrono: 16, phase: 4, wm: { font: "bebas", gradient: widowCrimson, aura: "#c01824" } },
  { id: "shang-chi", title: "Shang-Chi", sub: "Legend of the Ten Rings", year: 2021, type: "movie", mediaType: "movie", tmdbId: 566525, chrono: 26, phase: 4, wm: { font: "cinzel", gradient: shangGold, aura: "#f0c040", scale: 0.9 } },
  { id: "eternals", title: "Eternals", year: 2021, type: "movie", mediaType: "movie", tmdbId: 524434, chrono: 25, phase: 4, wm: { font: "cinzel", gradient: celestialGold, aura: "#ead9a0" } },
  { id: "no-way-home", title: "Spider-Man", sub: "No Way Home", year: 2021, type: "movie", mediaType: "movie", tmdbId: 634649, chrono: 27, phase: 4, wm: { font: "bebas", gradient: spidey, aura: "#e82c2c" } },
  { id: "multiverse-of-madness", title: "Doctor Strange", sub: "Multiverse of Madness", year: 2022, type: "movie", mediaType: "movie", tmdbId: 453395, chrono: 28, phase: 4, wm: { font: "cinzel", gradient: "linear-gradient(180deg,#ffe9c4 0%,#f0a030 40%,#8a2bd4 100%)", aura: "#b060e8", scale: 0.8 } },
  { id: "love-and-thunder", title: "Thor", sub: "Love and Thunder", year: 2022, type: "movie", mediaType: "movie", tmdbId: 616037, chrono: 29, phase: 4, wm: { font: "bangers", gradient: "linear-gradient(180deg,#fff05e 0%,#40b0e8 45%,#f03e8a 100%)", aura: "#40b0e8", scale: 1.1 } },
  { id: "wakanda-forever", title: "Wakanda Forever", sub: "Black Panther", year: 2022, type: "movie", mediaType: "movie", tmdbId: 505642, chrono: 30, phase: 4, wm: { font: "anton", gradient: pantherPurple, aura: "#9a6cf0", scale: 0.9 } },

  { id: "quantumania", title: "Quantumania", sub: "Ant-Man & The Wasp", year: 2023, type: "movie", mediaType: "movie", tmdbId: 640146, chrono: 31, phase: 5, wm: { font: "orbitron", gradient: quantum, aura: "#f060d0", scale: 0.85 } },
  { id: "guardians-3", title: "Guardians Vol. 3", sub: "of the Galaxy", year: 2023, type: "movie", mediaType: "movie", tmdbId: 447365, chrono: 32, phase: 5, wm: { font: "bangers", gradient: neonSunset, aura: "#8a2bd4", scale: 0.9 } },
  { id: "the-marvels", title: "The Marvels", year: 2023, type: "movie", mediaType: "movie", tmdbId: 609681, chrono: 33, phase: 5, wm: { font: "orbitron", gradient: "linear-gradient(180deg,#fff2c8 0%,#f0c040 40%,#e05038 70%,#3a6ab0 100%)", aura: "#f0c040", scale: 0.85 } },
  { id: "deadpool-wolverine", title: "Deadpool & Wolverine", year: 2024, type: "movie", mediaType: "movie", tmdbId: 533535, chrono: 34, phase: 5, wm: { font: "anton", gradient: deadpool, aura: "#ffd82a", scale: 0.85 } },
  { id: "brave-new-world", title: "Brave New World", sub: "Captain America", year: 2025, type: "movie", mediaType: "movie", tmdbId: 822119, chrono: 35, phase: 5, wm: { font: "blackops", gradient: "linear-gradient(180deg,#ffffff 0%,#c02030 45%,#3a6ab0 100%)", aura: "#e05060", scale: 0.85 } },
  { id: "thunderbolts", title: "The New Avengers", sub: "Thunderbolts*", year: 2025, type: "movie", mediaType: "movie", tmdbId: 986056, chrono: 36, phase: 5, wm: { font: "anton", gradient: "linear-gradient(180deg,#ffffff 0%,#c8c8d0 45%,#50505a 100%)", aura: "#d0d0d8", scale: 0.9 } },

  { id: "fantastic-four", title: "The Fantastic 4", sub: "First Steps", year: 2025, type: "movie", mediaType: "movie", tmdbId: 617126, chrono: 37, phase: 6, wm: { font: "orbitron", gradient: "linear-gradient(180deg,#e0f4ff 0%,#5ac8f0 45%,#e07030 100%)", aura: "#5ac8f0", scale: 0.85 } },
  { id: "brand-new-day", title: "Spider-Man", sub: "Brand New Day", year: 2026, type: "movie", mediaType: "movie", chrono: 38, phase: 6, wm: { font: "bebas", gradient: spidey, aura: "#e82c2c" } },
  { id: "doomsday", title: "Doomsday", sub: "Avengers", year: 2026, type: "movie", mediaType: "movie", tmdbId: 1003596, chrono: 39, phase: 6, wm: { font: "cinzel", gradient: doomGreen, aura: "#3dff6e", scale: 1.15 } },

  // ------------------------------------------------------------------
  // SIDE QUEST — TV shows (poster right column)
  // Netflix "Defenders Saga" block first (optional / semi-canon)
  // ------------------------------------------------------------------
  { id: "daredevil", title: "Daredevil", year: 2015, type: "netflix", mediaType: "tv", tmdbId: 61889, wm: { font: "cinzel", gradient: marvelRed, aura: "#c01218" } },
  { id: "jessica-jones", title: "Jessica Jones", year: 2015, type: "netflix", mediaType: "tv", tmdbId: 38472, wm: { font: "bebas", gradient: jessicaPurple, aura: "#b060e8" } },
  { id: "luke-cage", title: "Luke Cage", year: 2016, type: "netflix", mediaType: "tv", tmdbId: 62126, wm: { font: "anton", gradient: cageYellow, aura: "#f0c828" } },
  { id: "iron-fist", title: "Iron Fist", year: 2017, type: "netflix", mediaType: "tv", tmdbId: 62127, wm: { font: "cinzel", gradient: fistGreen, aura: "#50c878" } },
  { id: "defenders", title: "Defenders", year: 2017, type: "netflix", mediaType: "tv", tmdbId: 62285, wm: { font: "anton", gradient: steel, aura: "#e8e8e8" } },
  { id: "punisher", title: "Punisher", year: 2017, type: "netflix", mediaType: "tv", tmdbId: 67178, wm: { font: "blackops", gradient: punisherBone, aura: "#d0d0d0" } },

  // Disney+ MCU shows
  { id: "wandavision", title: "WandaVision", year: 2021, type: "show", mediaType: "tv", tmdbId: 85271, keySeries: { why: "Wanda's turn into the Scarlet Witch, which Multiverse of Madness picks straight up.", after: "far-from-home", chronoAfter: "endgame" }, wm: { font: "monoton", gradient: wandaCrimson, aura: "#e83050", scale: 0.7 } },
  { id: "falcon-winter-soldier", title: "Winter Soldier", sub: "The Falcon and the", year: 2021, type: "show", mediaType: "tv", tmdbId: 88396, keySeries: { why: "Sam Wilson takes up the shield; Brave New World and Doomsday's Cap start here.", after: "wandavision", chronoAfter: "wandavision" }, wm: { font: "blackops", gradient: "linear-gradient(180deg,#e8f2ff 0%,#c02030 45%,#7d8ba0 100%)", aura: "#8fa8c8", scale: 0.7 } },
  { id: "loki", title: "Loki", year: 2021, type: "show", mediaType: "tv", tmdbId: 84958, keySeries: { why: "The multiverse, the TVA and Kang. The one series on Disney's official watch-before-Doomsday list.", after: "falcon-winter-soldier", chronoAfter: "far-from-home" }, wm: { font: "cinzel", gradient: "linear-gradient(180deg,#d8ffd0 0%,#50c878 40%,#f0c040 75%,#e8b64c 100%)", aura: "#50c878", chaos: true, scale: 1.15 } },
  { id: "hawkeye", title: "Hawkeye", year: 2021, type: "show", mediaType: "tv", tmdbId: 88329, wm: { font: "bebas", gradient: jessicaPurple, aura: "#8a5ad4" } },
  { id: "moon-knight", title: "Moon Knight", year: 2022, type: "show", mediaType: "tv", tmdbId: 92749, wm: { font: "creepster", gradient: moonWhite, aura: "#e8ecf4" } },
  { id: "ms-marvel", title: "Ms. Marvel", year: 2022, type: "show", mediaType: "tv", tmdbId: 92782, keySeries: { why: "Kamala's mutant reveal, the MCU's first step toward the X-Men in Doomsday.", after: "multiverse-of-madness", chronoAfter: "guardians-3" }, wm: { font: "bangers", gradient: msMarvelPop, aura: "#f0b028" } },
  { id: "she-hulk", title: "She-Hulk", sub: "Attorney at Law", year: 2022, type: "show", mediaType: "tv", tmdbId: 92783, wm: { font: "bangers", gradient: gammaGreen, aura: "#4ed13c" } },
  { id: "echo", title: "Echo", year: 2024, type: "show", mediaType: "tv", tmdbId: 122226, wm: { font: "anton", gradient: "linear-gradient(180deg,#f0e0d0 0%,#c08858 45%,#5a3018 100%)", aura: "#c08858", scale: 1.15 } },
  { id: "agatha-all-along", title: "Agatha All Along", year: 2024, type: "show", mediaType: "tv", tmdbId: 138501, wm: { font: "cinzel", gradient: agathaViolet, aura: "#b478e8", scale: 0.85 } },
  { id: "daredevil-born-again", title: "Daredevil", sub: "Born Again", year: 2025, type: "show", mediaType: "tv", tmdbId: 202555, wm: { font: "cinzel", gradient: marvelRed, aura: "#c01218" } },
  { id: "ironheart", title: "Ironheart", year: 2025, type: "show", mediaType: "tv", tmdbId: 114472, wm: { font: "russo", gradient: metallicGold, aura: "#e8b64c", scale: 0.9 } },
  { id: "wonder-man", title: "Wonder Man", year: 2025, type: "show", mediaType: "tv", wm: { font: "anton", gradient: wonderGreen, aura: "#78d858" } },
  { id: "punisher-special", title: "Punisher", sub: "One Last Kill", year: 2026, type: "show", mediaType: "tv", wm: { font: "blackops", gradient: punisherBone, aura: "#d0d0d0" } },
  { id: "visionquest", title: "VisionQuest", year: 2026, type: "show", mediaType: "tv", wm: { font: "orbitron", gradient: visionGold, aura: "#e8cc88", scale: 0.85 } },
];

export const MOVIES = TIMELINE.filter((e) => e.type === "movie");
export const SHOWS = TIMELINE.filter((e) => e.type !== "movie");
/** movies the countdown counts (everything before the Doomsday finish line) */
export const COUNTED_MOVIES = MOVIES.filter((e) => e.id !== "doomsday");

export const PHASE_LABELS: Record<number, string> = {
  1: "Phase One",
  2: "Phase Two",
  3: "Phase Three — The Infinity Saga",
  4: "Phase Four — The Multiverse Saga",
  5: "Phase Five",
  6: "Phase Six — The Road Ends",
};

export interface PhaseBoss {
  name: string;
  /** the movie you beat them in */
  movie: string;
  /** short victory quip shown on the splash */
  quip: string;
  /** transparent character render in /public/bosses */
  img: string;
}

/** the big bad you take down by finishing each phase */
export const PHASE_BOSSES: Record<number, PhaseBoss> = {
  1: { name: "Loki", movie: "The Avengers", quip: "Puny god.", img: "/bosses/loki.png" },
  2: { name: "Ultron", movie: "Age of Ultron", quip: "No strings on you.", img: "/bosses/ultron.png" },
  3: { name: "Thanos", movie: "Endgame", quip: "Avengers, assemble.", img: "/bosses/thanos.png" },
  4: { name: "Scarlet Witch", movie: "Multiverse of Madness", quip: "The multiverse survives.", img: "/bosses/wanda.png" },
  5: { name: "The Void", movie: "Thunderbolts*", quip: "The New Avengers rise.", img: "/bosses/void.png" },
  6: { name: "Doctor Doom", movie: "Doomsday", quip: "The road ends here.", img: "/bosses/doom.png" },
};

export const PHASE_COLORS: Record<number, string> = {
  1: "#e8b64c",
  2: "#e07030",
  3: "#c02030",
  4: "#8a2bd4",
  5: "#6a48e0",
  6: "#3dff6e",
};

/** Doomsday-relevant Disney+ series, in the order they slot into the trail */
export const KEY_SERIES = SHOWS.filter((e) => e.keySeries);

/**
 * Runtimes in minutes.  Movies are theatrical cuts; key series are whole-run
 * totals (approximate, credits included).  Static so totals work without TMDB.
 */
export const RUNTIMES: Record<string, number> = {
  "iron-man": 126,
  "incredible-hulk": 112,
  "iron-man-2": 124,
  thor: 115,
  "captain-america-1": 124,
  avengers: 143,
  "iron-man-3": 130,
  "thor-dark-world": 112,
  "captain-america-2": 136,
  guardians: 121,
  "age-of-ultron": 141,
  "ant-man": 117,
  "civil-war": 147,
  "doctor-strange": 115,
  "guardians-2": 136,
  homecoming: 133,
  ragnarok: 130,
  "black-panther": 134,
  "infinity-war": 149,
  "ant-man-2": 118,
  "captain-marvel": 124,
  endgame: 181,
  "far-from-home": 129,
  "black-widow": 134,
  "shang-chi": 132,
  eternals: 156,
  "no-way-home": 148,
  "multiverse-of-madness": 126,
  "love-and-thunder": 119,
  "wakanda-forever": 161,
  quantumania: 125,
  "guardians-3": 150,
  "the-marvels": 105,
  "deadpool-wolverine": 128,
  "brave-new-world": 118,
  thunderbolts: 127,
  "fantastic-four": 115,
  "brand-new-day": 150,
  // key series, full runs
  wandavision: 350,
  "falcon-winter-soldier": 320,
  loki: 610,
  "ms-marvel": 270,
};

export function runtimeOf(entry: Entry): number {
  return RUNTIMES[entry.id] ?? 0;
}

/** "41h 20m" */
export function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

export function entryById(id: string): Entry | undefined {
  return TIMELINE.find((e) => e.id === id);
}

export function moviesInOrder(mode: "release" | "chrono", withKeySeries = false): Entry[] {
  const movies = mode === "release" ? [...MOVIES] : [...MOVIES].sort((a, b) => (a.chrono ?? 99) - (b.chrono ?? 99));
  if (!withKeySeries) return movies;
  // slot each series in after its anchor; KEY_SERIES order lets series chain off each other
  for (const s of KEY_SERIES) {
    const anchor = mode === "release" ? s.keySeries!.after : s.keySeries!.chronoAfter;
    const i = movies.findIndex((e) => e.id === anchor);
    movies.splice(i + 1, 0, s);
  }
  return movies;
}
