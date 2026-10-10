/**
 * Hand-drawn pixel art.  Each sprite is a list of rows; every character is one
 * pixel looked up in the palette ("." is transparent).  The special palette
 * key "A" is filled with the caller's aura color at render time.
 */

export type Palette = Record<string, string>;

export interface Sprite {
  rows: string[];
  palette: Palette;
}

/** build a round icon from a distance-from-center rule (shields, reactors…) */
function round(size: number, pick: (d: number, x: number, y: number) => string): string[] {
  const c = (size - 1) / 2;
  return Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => pick(Math.hypot(x - c, y - c), x, y)).join(""),
  );
}

// ---------------------------------------------------------------------------
// HEROES — 12×16 player sprites, two walk frames each
// ---------------------------------------------------------------------------

const HEAD_SHORT = [
  "...KKKKKK...",
  "..KHHHHHHK..",
  ".KHHHHHHHHK.",
  ".KHHSSSSHHK.",
  ".KHSESSESHK.",
  "..KSSSSSSK..",
  "...KSSSSK...",
];

const HEAD_SPIKY = [
  ".K..K..K..K.",
  ".KHKHKKHKHK.",
  ".KHHHHHHHHK.",
  ".KHHSSSSHHK.",
  ".KHSESSESHK.",
  "..KSSSSSSK..",
  "...KSSSSK...",
];

const HEAD_LONG = [
  "...KKKKKK...",
  "..KHHHHHHK..",
  ".KHHHHHHHHK.",
  "KHHHSSSSHHHK",
  "KHHSESSESHHK",
  "KHHKSSSSKHHK",
  "KHHHKSSKHHHK",
];

const TORSO = [
  "..KKCYYCKK..",
  ".KCCCYYCCCK.",
  "KCKCCCCCCKCK",
  "KSKCCCCCCKSK",
  ".K.KDDDDK.K.",
  "...KDDDDK...",
];

const LEGS_A = ["...KDKKDK...", "..KBBKKBBK..", "..KKKKKKKK.."];
const LEGS_B = ["..KDK..KDK..", ".KBBK..KBBK.", ".KKKK..KKKK."];

type HeadStyle = "short" | "spiky" | "long";
const HEADS: Record<HeadStyle, string[]> = { short: HEAD_SHORT, spiky: HEAD_SPIKY, long: HEAD_LONG };

export interface Hero {
  name: string;
  frames: [Sprite, Sprite];
}

function hero(name: string, head: HeadStyle, palette: Palette): Hero {
  const pal = { K: "#0b0b14", E: "#14142a", ...palette };
  const body = [...HEADS[head], ...TORSO];
  return {
    name,
    frames: [
      { rows: [...body, ...LEGS_A], palette: pal },
      { rows: [...body, ...LEGS_B], palette: pal },
    ],
  };
}

const HERO_JAMES = hero("James", "short", {
  H: "#6a4222",
  S: "#f2c6a0",
  C: "#c8202c",
  D: "#7a0d12",
  Y: "#f0c040",
  B: "#f0c040",
});

const HERO_DENIZ = hero("Deniz", "spiky", {
  H: "#22222e",
  S: "#d9a47a",
  C: "#2b8fd6",
  D: "#173e7a",
  Y: "#e8e8f0",
  B: "#c02030",
});

const HERO_KATE = hero("Kate", "long", {
  H: "#c0502a",
  S: "#f4cfb0",
  C: "#8a48c4",
  D: "#41155f",
  Y: "#3dff6e",
  B: "#f0c040",
});

/** who walks the board for each profile */
export const PROFILE_HEROES: Record<string, Hero[]> = {
  "james-deniz": [HERO_JAMES, HERO_DENIZ],
  kate: [HERO_KATE],
};

// ---------------------------------------------------------------------------
// LEVEL EMBLEMS — 12×12 icons for each board node
// ---------------------------------------------------------------------------

export type IconKey =
  | "arc"
  | "fist"
  | "hammer"
  | "shield"
  | "avengers"
  | "cassette"
  | "ant"
  | "eye"
  | "spider"
  | "claw"
  | "star"
  | "hourglass"
  | "rings"
  | "sun"
  | "mask"
  | "bolt"
  | "four"
  | "doom"
  | "tv";

export const ICONS: Record<IconKey, Sprite> = {
  arc: {
    rows: round(12, (d) => (d > 6 ? "." : d > 5 ? "K" : d > 4 ? "G" : d > 2.6 ? "C" : "W")),
    palette: { K: "#1a1e28", G: "#9aa6b8", C: "#5ad8ff", W: "#effcff" },
  },
  fist: {
    rows: [
      "............",
      ".KKKKKKKKKK.",
      ".KLGKLGKLGK.",
      ".KGGKGGKGGK.",
      ".KGDKGDKGDK.",
      ".KKKKKKKKKK.",
      ".KLLLLLGGDK.",
      ".KKKKKKKGGK.",
      "..KGGGGGGDK.",
      "..KGGGGGGDK.",
      "..KDDDDDDDK.",
      "..KKKKKKKKK.",
    ],
    palette: { K: "#0c2a08", L: "#9af07a", G: "#4ed13c", D: "#1c6412" },
  },
  hammer: {
    rows: [
      ".KKKKKKKKKK.",
      ".KWWSSSSSSK.",
      ".KWSSSSSSDK.",
      ".KSSSSSSSDK.",
      ".KDDDDDDDDK.",
      ".KKKKBBKKKK.",
      "....KBBK....",
      "....KLLK....",
      "....KBBK....",
      "....KLLK....",
      "....KBBK....",
      "....KKKK....",
    ],
    palette: { K: "#14161e", S: "#9aa6b8", W: "#e8ecf4", D: "#5a6a80", B: "#7a4a22", L: "#c08858" },
  },
  shield: {
    rows: round(12, (d, x, y) => {
      if (d > 6) return ".";
      if (d > 5.1) return "K";
      if (d > 4.1) return "R";
      if (d > 3.1) return "W";
      if (d > 2.1) return "R";
      const star = (x === 5 || x === 6) || (y === 5 || y === 6);
      return star ? "W" : "B";
    }),
    palette: { K: "#0c1830", R: "#d42030", W: "#f4f4f8", B: "#1c4f9a" },
  },
  avengers: {
    rows: [
      "....KKKK....",
      "...KAAAAK...",
      "..KAAKKAAK..",
      "..KAAKKAAK..",
      ".KAAK..KAAK.",
      ".KAAKKKKAAK.",
      ".KAAAAAAAAK.",
      "KAAKKKKKKAAK",
      "KAAK....KAAK",
      "KAAK....KAAK",
      "KAAK....KAAK",
      "KKKK....KKKK",
    ],
    palette: { K: "#120a0c" },
  },
  cassette: {
    rows: [
      "............",
      "KKKKKKKKKKKK",
      "KOOOOOOOOOOK",
      "KOPPPPPPPPOK",
      "KOPKKPPKKPOK",
      "KOPKWPPKWPOK",
      "KOPPPPPPPPOK",
      "KOOOOOOOOOOK",
      "KOOKKKKKKOOK",
      "KOOKWWWWKOOK",
      "KKKKKKKKKKKK",
      "............",
    ],
    palette: { K: "#1a0a14", O: "#f09040", P: "#f03e8a", W: "#ffe95e" },
  },
  ant: {
    rows: [
      "..L......L..",
      "...L....L...",
      "....RRRR....",
      "...RWRRWR...",
      "...RRRRRR...",
      "L...RRRR...L",
      ".LLLRRRRLLL.",
      "....RRRR....",
      ".LLRRRRRRLL.",
      "L.RRRRRRRR.L",
      "...RRRRRR...",
      "....RRRR....",
    ],
    palette: { L: "#c8c8d0", R: "#e04858", W: "#ffe0e4" },
  },
  eye: {
    rows: [
      "............",
      "............",
      "...KKKKKK...",
      ".KKOOOOOOKK.",
      "KOOWWGGWWOOK",
      "KOWWGGGGWWOK",
      "KOWWGGGGWWOK",
      "KOOWWGGWWOOK",
      ".KKOOOOOOKK.",
      "...KKKKKK...",
      "............",
      "............",
    ],
    palette: { K: "#3a1a04", O: "#f0a030", W: "#fff2c8", G: "#3dff6e" },
  },
  spider: {
    rows: [
      "R..R....R..R",
      ".R..R..R..R.",
      "..R.RRRR.R..",
      "RR.RRRRRR.RR",
      "..RRRWWRRR..",
      ".R.RRRRRR.R.",
      "R.RRRDDRRR.R",
      "..RRDDDDRR..",
      ".R.RRDDRR.R.",
      "R...RRRR...R",
      "....R..R....",
      "...R....R...",
    ],
    palette: { R: "#e82c2c", W: "#ffffff", D: "#1a3a8a" },
  },
  claw: {
    rows: [
      "P...P...P...",
      "P...P...P...",
      "LP..LP..LP..",
      "LP..LP..LP..",
      ".LP..LP..LP.",
      ".LP..LP..LP.",
      ".LP..LP..LP.",
      "..LP..LP..LP",
      "..LP..LP..LP",
      "...P...P...P",
      "...P...P...P",
      "............",
    ],
    palette: { P: "#9a6cf0", L: "#f0e8ff" },
  },
  star: {
    rows: [
      ".....YY.....",
      "....YYYY....",
      "....YWYY....",
      "YYYYYWYYYYYY",
      ".YYYYYYYYYY.",
      "..YYYYYYYY..",
      "...YYYYYY...",
      "...YYYYYY...",
      "..YYYYYYYY..",
      "..YYY..YYY..",
      ".YY......YY.",
      ".Y........Y.",
    ],
    palette: { Y: "#f0c040", W: "#fff8d0" },
  },
  hourglass: {
    rows: [
      "............",
      ".RRRRRRRRRR.",
      "..RRRRRRRR..",
      "...RRRRRR...",
      "....RRRR....",
      ".....RR.....",
      ".....RR.....",
      "....RRRR....",
      "...RRRRRR...",
      "..RRRRRRRR..",
      ".RRRRRRRRRR.",
      "............",
    ],
    palette: { R: "#e01828" },
  },
  rings: {
    rows: round(12, (d) => (d > 6 ? "." : d > 5.1 ? "K" : d > 4.2 ? "Y" : d > 3.2 ? "L" : d > 2.4 ? "K" : ".")),
    palette: { K: "#3a2408", Y: "#f0c040", L: "#fff2c8" },
  },
  sun: {
    rows: [
      ".....YY.....",
      ".Y...YY...Y.",
      "..Y......Y..",
      "....YYYY....",
      "...YWWWWY...",
      "YY.YWWWWY.YY",
      "YY.YWWWWY.YY",
      "...YWWWWY...",
      "....YYYY....",
      "..Y......Y..",
      ".Y...YY...Y.",
      ".....YY.....",
    ],
    palette: { Y: "#ead9a0", W: "#fffbe8" },
  },
  mask: {
    rows: [
      "....RRRR....",
      "..RRRRRRRR..",
      ".RRRRRRRRRR.",
      ".KKKRRRRKKK.",
      "RKKKKRRKKKKR",
      "RKWWKRRKWWKR",
      "RKWWKRRKWWKR",
      "RKKKKRRKKKKR",
      ".KKKRRRRKKK.",
      ".RRRRRRRRRR.",
      "..RRRRRRRR..",
      "....RRRR....",
    ],
    palette: { R: "#ff2020", K: "#141414", W: "#ffffff" },
  },
  bolt: {
    rows: [
      "......WYYY..",
      ".....WYYY...",
      "....WYYY....",
      "...WYYY.....",
      "..WYYYYYYY..",
      ".YYYYYYYY...",
      "....YYYY....",
      "...YYYY.....",
      "..YYY.......",
      "..YY........",
      ".YY.........",
      ".Y..........",
    ],
    palette: { Y: "#f0e050", W: "#ffffff" },
  },
  four: {
    rows: [
      "....KKKK....",
      "..KKBBBBKK..",
      ".KBBBBWWBBK.",
      ".KBBBWBWBBK.",
      "KBBBWBBWBBBK",
      "KBBWBBBWBBBK",
      "KBBWWWWWWBBK",
      "KBBBBBBWBBBK",
      ".KBBBBBWBBK.",
      ".KBBBBBWBBK.",
      "..KKBBBBKK..",
      "....KKKK....",
    ],
    palette: { K: "#0a2448", B: "#3a8ad4", W: "#ffffff" },
  },
  doom: {
    rows: [
      "...KKKKKK...",
      "..KGGGGGGK..",
      ".KGMMMMMMGK.",
      ".KGMMMMMMGK.",
      "KGMKKMMKKMGK",
      "KGMKEMMEKMGK",
      "KGMMMMMMMMGK",
      "KGMMMKKMMMGK",
      "KGMMMMMMMMGK",
      "KGMKKKKKKMGK",
      ".KGMMMMMMGK.",
      "..KKKKKKKK..",
    ],
    palette: { K: "#05140a", G: "#0d5a26", M: "#9fb0c4", E: "#3dff6e" },
  },
  tv: {
    rows: [
      "...C....C...",
      "....C..C....",
      ".....CC.....",
      "KKKKKKKKKKKK",
      "KAAAAAAAADDK",
      "KAWAAAAAADCK",
      "KAAAAAAAADDK",
      "KAAAAAAAADCK",
      "KAAAAAAAADDK",
      "KKKKKKKKKKKK",
      ".KK......KK.",
      "............",
    ],
    palette: { K: "#0e0e16", C: "#c8c8d0", D: "#5a5a6a", W: "#ffffff" },
  },
};

const ICON_BY_ID: Record<string, IconKey> = {
  "iron-man": "arc",
  "iron-man-2": "arc",
  "iron-man-3": "arc",
  ironheart: "arc",
  "incredible-hulk": "fist",
  "she-hulk": "fist",
  thor: "hammer",
  "thor-dark-world": "hammer",
  ragnarok: "hammer",
  "love-and-thunder": "hammer",
  "captain-america-1": "shield",
  "captain-america-2": "shield",
  "civil-war": "shield",
  "brave-new-world": "shield",
  "falcon-winter-soldier": "shield",
  avengers: "avengers",
  "age-of-ultron": "avengers",
  "infinity-war": "avengers",
  endgame: "avengers",
  guardians: "cassette",
  "guardians-2": "cassette",
  "guardians-3": "cassette",
  "ant-man": "ant",
  "ant-man-2": "ant",
  quantumania: "ant",
  "doctor-strange": "eye",
  "multiverse-of-madness": "eye",
  homecoming: "spider",
  "far-from-home": "spider",
  "no-way-home": "spider",
  "brand-new-day": "spider",
  "black-panther": "claw",
  "wakanda-forever": "claw",
  "captain-marvel": "star",
  "the-marvels": "star",
  "ms-marvel": "star",
  "black-widow": "hourglass",
  "shang-chi": "rings",
  eternals: "sun",
  "deadpool-wolverine": "mask",
  thunderbolts: "bolt",
  "fantastic-four": "four",
  doomsday: "doom",
};

export function iconFor(id: string): IconKey {
  return ICON_BY_ID[id] ?? "tv";
}

// ---------------------------------------------------------------------------
// OVERWORLD SCENERY
// ---------------------------------------------------------------------------

export type DecoKey = "tree" | "bush" | "flower" | "cactus" | "rock" | "spire" | "lava" | "crystal" | "bubble" | "skull" | "clock";

export const DECOS: Record<DecoKey, Sprite> = {
  tree: {
    rows: [
      "...GGGG...",
      "..GGLGGG..",
      ".GGLGGGGG.",
      ".GGGGGGDG.",
      "GGGGGGGDGG",
      ".GGGGGDGG.",
      "..GDGGGG..",
      "....BB....",
      "....BB....",
      "...BBBB...",
    ],
    palette: { G: "#2e9a3a", L: "#7ae06a", D: "#1a5a22", B: "#6a4222" },
  },
  bush: {
    rows: ["..GGGG..", ".GLGGGG.", "GGGGGDGG", "GGGDGGGG", ".GGGGGG."],
    palette: { G: "#33a640", L: "#8ae878", D: "#1d6a26" },
  },
  flower: {
    rows: [".P.", "PYP", ".P.", ".G.", "GG."],
    palette: { P: "#ff6aa0", Y: "#ffe05a", G: "#3aa04a" },
  },
  cactus: {
    rows: ["...GG...", "...GL...", "G..GG...", "G..GG..G", "GG.GG..G", ".GGGG.GG", "...GGGG.", "...GG...", "...GG...", "..YYYY.."],
    palette: { G: "#3a9a48", L: "#7ad878", Y: "#6a5020" },
  },
  rock: {
    rows: ["..KKKK..", ".KLLSSK.", "KLSSSSSK", "KSSSSSDK", ".KKKKKK."],
    palette: { K: "#2a2420", L: "#c0b8b0", S: "#8a8278", D: "#5a5450" },
  },
  spire: {
    rows: ["...KK...", "..KRK...", "..KRRK..", ".KRRRK..", ".KRORRK.", "KRRORRK.", "KRRRRORK", "KKKKKKKK"],
    palette: { K: "#1a0606", R: "#5a2420", O: "#ff6a20" },
  },
  lava: {
    rows: ["..OOOOOO..", ".ORRYRRRO.", "ORYYRRRROO", ".OOOOOOOO."],
    palette: { O: "#3a0a06", R: "#ff5020", Y: "#ffd040" },
  },
  crystal: {
    rows: ["..CC..", ".CWCC.", ".CWCC.", "CCWCCD", "CCWCDD", "CCCCDD", "CCCDDD", ".CCDD.", ".CCDD.", "..DD.."],
    palette: { C: "#b060f0", W: "#f0d0ff", D: "#6a2ab0" },
  },
  bubble: {
    rows: [".WWWW.", "WL...W", "W....W", "W....W", "W...DW", ".WWWW."],
    palette: { W: "#7ad8ff", L: "#ffffff", D: "#3a8ad4" },
  },
  skull: {
    rows: [".WWWWW.", "WWWWWWW", "WKKWKKW", "WKKWKKW", "WWWKWWW", ".WWWWW.", ".W.W.W."],
    palette: { W: "#c8d0c0", K: "#0a140a" },
  },
  clock: {
    rows: ["..OOOO..", ".OWWWWO.", "OWWKWWWO", "OWWKWWWO", "OWWKKKWO", "OWWWWWWO", ".OWWWWO.", "..OOOO.."],
    palette: { O: "#f08a20", W: "#ffe8c0", K: "#3a2008" },
  },
};

/** the flag you plant on a cleared stage */
export function flagSprite(color: string): Sprite {
  return {
    rows: [
      "PFFFFF..",
      "PFFWFFF.",
      "PFFFFFFF",
      "PFFFFFF.",
      "PFFFF...",
      "P.......",
      "P.......",
      "P.......",
      "P.......",
      "P.......",
      "KK......",
    ],
    palette: { P: "#ece4d0", F: color, W: "#ffffff", K: "#2a2010" },
  };
}

/** round stepping-stone pad under each level marker */
export function padSprite(rim: string, fill: string, shade: string): Sprite {
  const W = 16;
  const H = 10;
  const cx = (W - 1) / 2;
  const cy = (H - 1) / 2;
  const rows = Array.from({ length: H }, (_, y) =>
    Array.from({ length: W }, (_, x) => {
      const d = Math.hypot((x - cx) / (W / 2), (y - cy) / (H / 2));
      if (d > 1.02) return ".";
      if (d > 0.84) return "K";
      if (d > 0.68) return "R";
      return y > cy + 1 ? "S" : "F";
    }).join(""),
  );
  return { rows, palette: { K: "#0a0814", R: rim, F: fill, S: shade } };
}
