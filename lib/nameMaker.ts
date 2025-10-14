const funAdjectives: string[] = [
  "Zany",
  "Epic",
  "Snug",
  "Bold",
  "Cheer",
  "Mild",
  "Wild",
  "Chic",
  "Perk",
  "Lush",
  "Neat",
  "Jolly",
  "Spicy",
  "Brisk",
  "Breez",
  "Spunk",
  "Quirk",
  "Happy",
  "Cool",
  "Wavy",
];

const funNouns: string[] = [
  "Fox",
  "Owl",
  "Frog",
  "Cat",
  "Dog",
  "Bee",
  "Duck",
  "Wolf",
  "Bat",
  "Fish",
  "Pony",
  "Goat",
  "Hawk",
  "Lion",
  "Crab",
  "Toad",
  "Bear",
  "Ant",
  "Mole",
  "Yak",
];

export function generateUsername(): string {
  const adjective =
    funAdjectives[Math.floor(Math.random() * funAdjectives.length)];
  const noun = funNouns[Math.floor(Math.random() * funNouns.length)];
  return `${adjective} ${noun}`;
}
