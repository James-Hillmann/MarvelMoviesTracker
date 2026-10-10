/**
 * Pop-quiz bank — three questions per movie, unlocked once that movie is
 * checked off.  Spoiler rules: every question (and every wrong answer) only
 * draws on the movie it belongs to or earlier releases, so a quiz never
 * leaks a later film.  Movies not out yet (or too new to write up) have no
 * quiz and simply never prompt.
 */

export interface TriviaQuestion {
  q: string;
  /** the correct answer */
  a: string;
  /** three wrong answers */
  wrong: [string, string, string];
}

export const TRIVIA: Record<string, TriviaQuestion[]> = {
  "iron-man": [
    { q: "Where is Tony Stark held captive at the start?", a: "Afghanistan", wrong: ["Iraq", "Pakistan", "Kazakhstan"] },
    { q: "Who helps Tony build his first suit in the cave?", a: "Ho Yinsen", wrong: ["Obadiah Stane", "Raza", "Happy Hogan"] },
    { q: "How does Tony end the final press conference?", a: "“I am Iron Man.”", wrong: ["“I’m retiring.”", "“Stark Industries is closing.”", "“No more questions.”"] },
  ],
  "incredible-hulk": [
    { q: "Which country is Bruce Banner hiding in at the start?", a: "Brazil", wrong: ["Mexico", "India", "Canada"] },
    { q: "What does Emil Blonsky turn into?", a: "The Abomination", wrong: ["The Rhino", "The Wendigo", "The Juggernaut"] },
    { q: "Who is Betty Ross’s father?", a: "General Thaddeus Ross", wrong: ["Nick Fury", "Colonel Rhodes", "General Talbot"] },
  ],
  "iron-man-2": [
    { q: "What’s slowly poisoning Tony through his arc reactor?", a: "Palladium", wrong: ["Uranium", "Cobalt", "Mercury"] },
    { q: "What name does Natasha Romanoff use while undercover at Stark Industries?", a: "Natalie Rushman", wrong: ["Nadia Romanova", "Natalie Rogers", "Nina Rush"] },
    { q: "Who flies off in the Mark II suit and becomes War Machine?", a: "James “Rhodey” Rhodes", wrong: ["Happy Hogan", "Justin Hammer", "Phil Coulson"] },
  ],
  thor: [
    { q: "Where on Earth does Thor land after being banished?", a: "New Mexico", wrong: ["Arizona", "Nevada", "Texas"] },
    { q: "What is the name of Thor’s hammer?", a: "Mjolnir", wrong: ["Gungnir", "Gjallarhorn", "Jarnbjorn"] },
    { q: "What does Loki discover about where he came from?", a: "He was born a Frost Giant", wrong: ["He’s half human", "He was born on Vanaheim", "He’s Heimdall’s son"] },
  ],
  "captain-america-1": [
    { q: "Who created the Super Soldier Serum given to Steve Rogers?", a: "Dr. Abraham Erskine", wrong: ["Howard Stark", "Arnim Zola", "Johann Schmidt"] },
    { q: "Which organization does the Red Skull lead?", a: "Hydra", wrong: ["A.I.M.", "Leviathan", "The Ten Rings"] },
    { q: "What metal is Cap’s round shield made of?", a: "Vibranium", wrong: ["Adamantium", "Titanium", "Steel alloy"] },
  ],
  avengers: [
    { q: "What cosmic object does Loki steal at the start?", a: "The Tesseract", wrong: ["The Casket of Ancient Winters", "The Bifrost key", "The Heart of Asgard"] },
    { q: "Whose death does Nick Fury use to rally the team?", a: "Agent Phil Coulson", wrong: ["Agent Maria Hill", "Agent Jasper Sitwell", "Dr. Erik Selvig"] },
    { q: "What does the team quietly eat after the battle?", a: "Shawarma", wrong: ["Pizza", "Tacos", "Hot dogs"] },
  ],
  "iron-man-3": [
    { q: "Who turns out to be playing “The Mandarin” on TV?", a: "An actor, Trevor Slattery", wrong: ["Aldrich Killian himself", "Justin Hammer", "Ho Yinsen’s brother"] },
    { q: "What is Killian’s regenerative program called?", a: "Extremis", wrong: ["Centipede", "Project Pegasus", "Vita-Ray"] },
    { q: "What is the name of the kid who helps Tony in Tennessee?", a: "Harley Keener", wrong: ["Tommy Hollis", "Joey Fuller", "Billy Dent"] },
  ],
  "thor-dark-world": [
    { q: "Which realm do Malekith and the Dark Elves come from?", a: "Svartalfheim", wrong: ["Jotunheim", "Vanaheim", "Muspelheim"] },
    { q: "What ancient force does Jane accidentally absorb?", a: "The Aether", wrong: ["The Tesseract", "The Odin Force", "Muspel fire"] },
    { q: "Where does Thor hang Mjolnir in Jane’s apartment?", a: "On a coat hook", wrong: ["On the fridge door", "On a lamp", "On the doorknob"] },
  ],
  "captain-america-2": [
    { q: "Who is the Winter Soldier?", a: "Bucky Barnes", wrong: ["Brock Rumlow", "Jasper Sitwell", "Georges Batroc"] },
    { q: "Which S.H.I.E.L.D. leader is secretly running Hydra?", a: "Alexander Pierce", wrong: ["Nick Fury", "Maria Hill", "Sharon Carter"] },
    { q: "What codename does Sam Wilson go by?", a: "Falcon", wrong: ["Nighthawk", "Skylark", "Condor"] },
  ],
  guardians: [
    { q: "What’s on the cassette in Peter Quill’s Walkman?", a: "Awesome Mix Vol. 1", wrong: ["Greatest Hits of ’79", "Mom’s Road Trip Tape", "Totally Rad Mix"] },
    { q: "Who is the Kree fanatic hunting the Orb?", a: "Ronan the Accuser", wrong: ["Korath", "The Collector", "Yondu"] },
    { q: "On which planet does Quill find the Orb at the start?", a: "Morag", wrong: ["Xandar", "Knowhere", "The Kyln"] },
  ],
  "age-of-ultron": [
    { q: "Who builds Ultron?", a: "Tony Stark and Bruce Banner", wrong: ["Tony Stark and Hank Pym", "Baron Strucker", "Hydra scientists"] },
    { q: "Which country does Ultron lift into the sky?", a: "Sokovia", wrong: ["Transia", "Symkaria", "Bulgaria"] },
    { q: "Where does Hawkeye take the team to lie low?", a: "His family’s farmhouse", wrong: ["Avengers Tower", "Tony’s Malibu house", "A S.H.I.E.L.D. bunker"] },
  ],
  "ant-man": [
    { q: "Who invented the Ant-Man suit?", a: "Hank Pym", wrong: ["Darren Cross", "Howard Stark", "Jim Paxton"] },
    { q: "What is Darren Cross’s suit called?", a: "Yellowjacket", wrong: ["Hornet", "Firefly", "Stinger"] },
    { q: "Which Avenger does Scott tangle with at the Avengers facility?", a: "Falcon", wrong: ["War Machine", "Hawkeye", "Vision"] },
  ],
  "civil-war": [
    { q: "What agreement splits the Avengers in two?", a: "The Sokovia Accords", wrong: ["The Superhuman Registration Act", "The Avengers Charter", "The Vienna Protocol"] },
    { q: "Who is secretly pulling the strings behind it all?", a: "Helmut Zemo", wrong: ["Brock Rumlow", "Alexander Pierce", "Thaddeus Ross"] },
    { q: "Where does the big airport battle take place?", a: "Germany", wrong: ["Austria", "Nigeria", "Russia"] },
  ],
  "doctor-strange": [
    { q: "What ends Stephen Strange’s surgical career?", a: "A car crash that wrecks his hands", wrong: ["A lab explosion", "A mugging gone wrong", "A plane crash"] },
    { q: "What is the name of the hidden temple Strange finds in Kathmandu?", a: "Kamar-Taj", wrong: ["K’un-Lun", "Shangri-La", "Agartha"] },
    { q: "How does Strange beat Dormammu?", a: "Traps them both in a time loop", wrong: ["Banishes him to the Mirror Dimension", "Seals him in the Sanctum", "Out-duels him with the Cloak"] },
  ],
  "guardians-2": [
    { q: "Who turns out to be Peter Quill’s father?", a: "Ego", wrong: ["Yondu", "Stakar Ogord", "The Collector"] },
    { q: "What is Mantis’s power?", a: "Feeling and soothing others’ emotions", wrong: ["Telekinesis", "Shapeshifting", "Turning invisible"] },
    { q: "Which Ravager leads the mutiny against Yondu?", a: "Taserface", wrong: ["Kraglin", "Stakar", "Tullk"] },
  ],
  homecoming: [
    { q: "What villain name does Adrian Toomes go by?", a: "The Vulture", wrong: ["The Shocker", "The Tinkerer", "The Scorpion"] },
    { q: "What’s the big twist about Adrian Toomes?", a: "He’s Liz’s father", wrong: ["He’s Ned’s uncle", "He’s dating Aunt May", "He’s Flash’s dad"] },
    { q: "Who does Tony assign as Peter’s Stark Industries handler?", a: "Happy Hogan", wrong: ["Pepper Potts", "Rhodey", "F.R.I.D.A.Y."] },
  ],
  ragnarok: [
    { q: "Who is the Goddess of Death?", a: "Hela", wrong: ["Sif", "Brunnhilde", "Amora"] },
    { q: "On which planet is Thor forced to fight as a gladiator?", a: "Sakaar", wrong: ["Xandar", "Morag", "Knowhere"] },
    { q: "Who is the Grandmaster’s reigning champion?", a: "The Hulk", wrong: ["Korg", "Surtur", "Fenris"] },
  ],
  "black-panther": [
    { q: "Who is T’Challa’s long-lost cousin who comes for the throne?", a: "Erik Killmonger", wrong: ["M’Baku", "W’Kabi", "Zuri"] },
    { q: "Who leads the Dora Milaje?", a: "Okoye", wrong: ["Nakia", "Shuri", "Ramonda"] },
    { q: "What gives the Black Panther his powers?", a: "The heart-shaped herb", wrong: ["A vibranium serum", "The Super Soldier Serum", "A sacred panther mask"] },
  ],
  "infinity-war": [
    { q: "Where does Thanos get the Soul Stone?", a: "Vormir", wrong: ["Titan", "Xandar", "Nidavellir"] },
    { q: "What new weapon does Thor forge at Nidavellir?", a: "Stormbreaker", wrong: ["Jarnbjorn", "Gungnir", "The Twilight Sword"] },
    { q: "What is Thanos’s home planet?", a: "Titan", wrong: ["Vormir", "Sakaar", "Hala"] },
  ],
  "ant-man-2": [
    { q: "Who are Hank and Hope trying to rescue from the Quantum Realm?", a: "Janet van Dyne", wrong: ["Cassie Lang", "Maggie Lang", "Bill Foster"] },
    { q: "What’s the name of the villain who phases through walls?", a: "Ghost", wrong: ["Wraith", "Shade", "Specter"] },
    { q: "Why is Scott under house arrest?", a: "For fighting in Germany against the Accords", wrong: ["For breaking into Pym’s lab", "For the Vistacorp robbery", "For unpaid parking tickets"] },
  ],
  "captain-marvel": [
    { q: "What do the Kree call Carol Danvers?", a: "Vers", wrong: ["Minn-Erva", "Yon-Rogg", "Mar-Vell"] },
    { q: "Which shape-shifting aliens are the Kree at war with?", a: "The Skrulls", wrong: ["The Badoon", "The Brood", "The Shi’ar"] },
    { q: "What’s the name of the cat (that isn’t really a cat)?", a: "Goose", wrong: ["Maverick", "Iceman", "Chewie"] },
  ],
  endgame: [
    { q: "How many years pass after the opening before the story picks back up?", a: "Five years", wrong: ["One year", "Two years", "Ten years"] },
    { q: "Where has Thor been living since the snap?", a: "New Asgard, in Norway", wrong: ["Wakanda", "Sakaar", "Iceland"] },
    { q: "Who does Steve hand his shield to at the end?", a: "Sam Wilson", wrong: ["Bucky Barnes", "Peggy Carter", "Peter Parker"] },
  ],
  "far-from-home": [
    { q: "What is Mysterio’s real name?", a: "Quentin Beck", wrong: ["Adrian Toomes", "Mac Gargan", "Max Dillon"] },
    { q: "What does Tony’s AI in the sunglasses call itself?", a: "E.D.I.T.H.", wrong: ["F.R.I.D.A.Y.", "J.A.R.V.I.S.", "K.A.R.E.N."] },
    { q: "Who airs the footage unmasking Peter in the mid-credits scene?", a: "J. Jonah Jameson", wrong: ["Eddie Brock", "Ben Urich", "Betty Brant"] },
  ],
  "black-widow": [
    { q: "What is the program that trained Natasha called?", a: "The Red Room", wrong: ["The Raft", "The Kyln", "The Siberian Facility"] },
    { q: "Who is Natasha’s “little sister”?", a: "Yelena Belova", wrong: ["Melina Vostokoff", "Antonia Dreykov", "Sharon Carter"] },
    { q: "What’s Alexei’s old superhero alias?", a: "Red Guardian", wrong: ["Crimson Dynamo", "Taskmaster", "Winter Soldier"] },
  ],
  "shang-chi": [
    { q: "What job does Shang-Chi have in San Francisco with Katy?", a: "Hotel valet", wrong: ["Bus driver", "Line cook", "Bartender"] },
    { q: "What is Shang-Chi’s father’s name?", a: "Wenwu", wrong: ["Razor Fist", "Death Dealer", "Jon Jon"] },
    { q: "What is the hidden village Shang-Chi’s mother came from?", a: "Ta Lo", wrong: ["K’un-Lun", "Kamar-Taj", "Wakanda"] },
  ],
  eternals: [
    { q: "Which Celestial created the Eternals?", a: "Arishem", wrong: ["Ego", "Dormammu", "Kronos"] },
    { q: "What creatures were the Eternals sent to fight?", a: "The Deviants", wrong: ["The Chitauri", "The Skrulls", "The Dark Elves"] },
    { q: "What has Kingo been doing for the last century?", a: "Starring in Bollywood films", wrong: ["Teaching at a university", "Running a museum", "Living as a monk"] },
  ],
  "no-way-home": [
    { q: "Whose spell goes wrong and cracks open the multiverse?", a: "Doctor Strange’s", wrong: ["Wong’s", "Wanda’s", "Mordo’s"] },
    { q: "Where does the final battle take place?", a: "The Statue of Liberty", wrong: ["Times Square", "The Brooklyn Bridge", "The Empire State Building"] },
    { q: "What’s the cost of Strange’s final spell?", a: "Everyone forgets Peter Parker", wrong: ["Peter loses his powers", "Strange loses his magic", "Spider-Man is banned from New York"] },
  ],
  "multiverse-of-madness": [
    { q: "What is America Chavez’s power?", a: "Travelling between universes", wrong: ["Seeing the future", "Turning invisible", "Copying other people’s powers"] },
    { q: "Which evil book has corrupted Wanda?", a: "The Darkhold", wrong: ["The Book of Vishanti", "The Book of Cagliostro", "The Necronomicon"] },
    { q: "What does Earth-838’s council of heroes call itself?", a: "The Illuminati", wrong: ["The Masters of the Mystic Arts", "The Defenders", "The Sorcerers Supreme"] },
  ],
  "love-and-thunder": [
    { q: "Who is the villain hunting gods?", a: "Gorr the God Butcher", wrong: ["Zeus", "Malekith", "Hela"] },
    { q: "Who wields Mjolnir as the Mighty Thor?", a: "Jane Foster", wrong: ["Valkyrie", "Sif", "Darcy Lewis"] },
    { q: "What pulls Thor’s ship?", a: "Two giant screaming goats", wrong: ["A winged horse", "A Ravager tow ship", "Korg on a skateboard"] },
  ],
  "wakanda-forever": [
    { q: "What is Namor’s underwater kingdom called?", a: "Talokan", wrong: ["Atlantis", "Ta Lo", "Xibalba"] },
    { q: "Who becomes the new Black Panther?", a: "Shuri", wrong: ["Okoye", "Nakia", "M’Baku"] },
    { q: "What did Riri Williams build that put her on Namor’s radar?", a: "A vibranium detector", wrong: ["A time machine", "A flying suit", "A deep-sea submarine"] },
  ],
  quantumania: [
    { q: "Who is the exiled conqueror trapped in the Quantum Realm?", a: "Kang", wrong: ["Ultron", "Dormammu", "Ronan"] },
    { q: "Who turns out to be M.O.D.O.K.?", a: "Darren Cross", wrong: ["Hank Pym", "Bill Foster", "Sonny Burch"] },
    { q: "What is Veb weirdly obsessed with?", a: "Holes", wrong: ["Snacks", "Legs", "Friends"] },
  ],
  "guardians-3": [
    { q: "Who experimented on Rocket?", a: "The High Evolutionary", wrong: ["Ego", "The Collector", "Ronan"] },
    { q: "Which golden race sends Adam Warlock after Rocket?", a: "The Sovereign", wrong: ["The Kree", "The Nova Corps", "The Ravagers"] },
    { q: "What’s the name of Rocket’s otter friend?", a: "Lylla", wrong: ["Floor", "Teefs", "Ottie"] },
  ],
  "the-marvels": [
    { q: "What happens when Carol, Monica and Kamala use their powers at the same time?", a: "They swap places", wrong: ["Their powers merge", "They all teleport to Hala", "Their powers switch off"] },
    { q: "Who is the Kree leader hunting the bangles?", a: "Dar-Benn", wrong: ["Yon-Rogg", "Minn-Erva", "Talos"] },
    { q: "How does Fury’s crew evacuate the space station?", a: "Flerken kittens swallow them", wrong: ["Through a jump point", "In Kree escape pods", "Carol carries the station"] },
  ],
  "deadpool-wolverine": [
    { q: "What job is Wade working before the TVA picks him up?", a: "Used car salesman", wrong: ["Taxi driver", "Bartender", "Pizza delivery"] },
    { q: "Who rules the Void?", a: "Cassandra Nova", wrong: ["Emma Frost", "Mystique", "Lady Deathstrike"] },
    { q: "What does Wade name the dog variant of himself?", a: "Mary Puppins", wrong: ["Dogpool Prime", "Peanut", "Sir Barks-a-Lot"] },
  ],
  "brave-new-world": [
    { q: "Who takes over the Falcon mantle for Sam?", a: "Joaquin Torres", wrong: ["Bucky Barnes", "Isaiah Bradley", "John Walker"] },
    { q: "What does President Ross transform into?", a: "Red Hulk", wrong: ["The Abomination", "The Leader", "Grey Hulk"] },
    { q: "What new metal is found on Celestial Island?", a: "Adamantium", wrong: ["Vibranium", "Uru", "Promethium"] },
  ],
  thunderbolts: [
    { q: "What’s the name of Bob’s golden hero persona?", a: "The Sentry", wrong: ["Wonder Man", "Blue Marvel", "Hyperion"] },
    { q: "Who lures the team into the vault to get rid of them?", a: "Valentina Allegra de Fontaine", wrong: ["Helmut Zemo", "Sharon Carter", "Mel"] },
    { q: "What does Valentina rebrand the team as at the end?", a: "The New Avengers", wrong: ["The Thunderbolts", "The Dark Avengers", "The Young Avengers"] },
  ],
  "fantastic-four": [
    { q: "Which Earth do the Fantastic Four live on?", a: "Earth-828", wrong: ["Earth-616", "Earth-838", "Earth-199999"] },
    { q: "Who arrives as Galactus’s herald?", a: "The Silver Surfer", wrong: ["The Mole Man", "The Super-Skrull", "Annihilus"] },
    { q: "What do Reed and Sue name their baby?", a: "Franklin", wrong: ["Valeria", "Reed Jr.", "Johnny"] },
  ],
};

export function triviaFor(id: string): TriviaQuestion[] | undefined {
  return TRIVIA[id];
}

/** count how many submitted answers match the bank, in order */
export function gradeQuiz(id: string, answers: string[]): { score: number; total: number } | null {
  const qs = TRIVIA[id];
  if (!qs || answers.length !== qs.length) return null;
  const score = qs.reduce((n, q, i) => n + (answers[i] === q.a ? 1 : 0), 0);
  return { score, total: qs.length };
}

export interface QuizResult {
  /** best score so far */
  best: number;
  total: number;
  /** number of times taken */
  tries: number;
  /** epoch ms of the latest attempt */
  at: number;
}

export type TriviaMap = Record<string, QuizResult>;
