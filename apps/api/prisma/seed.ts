import { PrismaClient, Gender, GenderPreference, LikeTargetType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ============================================================================
// Seed Data Arrays
// ============================================================================

const FIRST_NAMES_WOMEN = [
  "Emma", "Olivia", "Ava", "Sophia", "Isabella",
  "Mia", "Charlotte", "Amelia", "Harper", "Evelyn",
  "Abigail", "Emily", "Ella", "Scarlett", "Grace",
  "Chloe", "Lily", "Aria", "Zoe", "Nora",
  "Riley", "Layla", "Luna", "Stella", "Penelope",
];

const FIRST_NAMES_MEN = [
  "Liam", "Noah", "Oliver", "James", "Elijah",
  "William", "Henry", "Lucas", "Benjamin", "Theodore",
  "Jack", "Alexander", "Daniel", "Matthew", "Sebastian",
  "Owen", "Ethan", "Aiden", "Mason", "Logan",
  "Samuel", "Nathan", "Ryan", "Dylan", "Caleb",
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones",
  "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
  "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin",
  "Lee", "Perez", "Thompson", "White", "Harris",
  "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
  "Walker", "Young", "Allen", "King", "Wright",
  "Scott", "Torres", "Nguyen", "Hill", "Flores",
  "Green", "Adams", "Nelson", "Baker", "Hall",
  "Rivera", "Campbell", "Mitchell", "Carter", "Roberts",
];

const JOB_TITLES = [
  "Software Engineer", "Product Manager", "Data Scientist",
  "UX Designer", "Marketing Manager", "Financial Analyst",
  "Physician", "Nurse Practitioner", "Attorney",
  "Architect", "Teacher", "Professor",
  "Graphic Designer", "Content Creator", "Photographer",
  "Consultant", "Accountant", "Sales Manager",
  "Research Scientist", "Civil Engineer", "Mechanical Engineer",
  "Pharmacist", "Veterinarian", "Social Worker",
  "Real Estate Agent", "Chef", "Personal Trainer",
  "Journalist", "Environmental Scientist", "Psychologist",
];

const COMPANIES = [
  "Google", "Apple", "Meta", "Amazon", "Microsoft",
  "Netflix", "Spotify", "Airbnb", "Uber", "Lyft",
  "Stripe", "Square", "Salesforce", "Adobe", "Tesla",
  "JPMorgan Chase", "Goldman Sachs", "McKinsey", "Deloitte", "BCG",
  "Memorial Hospital", "City General Hospital", "Private Practice",
  "Columbia University", "NYU", "Stanford",
  "Self-Employed", "Freelance", "Startup",
  "Bank of America",
];

const SCHOOLS = [
  "Harvard University", "Stanford University", "MIT",
  "Columbia University", "University of Chicago", "Yale University",
  "NYU", "UCLA", "UC Berkeley", "University of Michigan",
  "Cornell University", "Georgetown University", "Duke University",
  "Northwestern University", "USC", "University of Virginia",
  "Boston University", "Emory University", "Vanderbilt University",
  "University of Texas at Austin", "Georgia Tech", "Penn State",
  "University of Florida", "Ohio State University", "University of Washington",
];

// Major US city locations (lat, lon)
const LOCATIONS: { city: string; lat: number; lon: number }[] = [
  { city: "New York", lat: 40.71, lon: -74.01 },
  { city: "New York", lat: 40.73, lon: -73.99 },
  { city: "New York", lat: 40.76, lon: -73.97 },
  { city: "Brooklyn", lat: 40.68, lon: -73.94 },
  { city: "Los Angeles", lat: 34.05, lon: -118.24 },
  { city: "Los Angeles", lat: 34.02, lon: -118.50 },
  { city: "Santa Monica", lat: 34.01, lon: -118.49 },
  { city: "San Francisco", lat: 37.77, lon: -122.42 },
  { city: "San Francisco", lat: 37.79, lon: -122.41 },
  { city: "Oakland", lat: 37.80, lon: -122.27 },
  { city: "Chicago", lat: 41.88, lon: -87.63 },
  { city: "Chicago", lat: 41.90, lon: -87.65 },
  { city: "Austin", lat: 30.27, lon: -97.74 },
  { city: "Seattle", lat: 47.61, lon: -122.33 },
  { city: "Denver", lat: 39.74, lon: -104.99 },
  { city: "Boston", lat: 42.36, lon: -71.06 },
  { city: "Miami", lat: 25.76, lon: -80.19 },
  { city: "Portland", lat: 45.51, lon: -122.68 },
  { city: "Nashville", lat: 36.16, lon: -86.78 },
  { city: "Atlanta", lat: 33.75, lon: -84.39 },
  { city: "Philadelphia", lat: 39.95, lon: -75.17 },
  { city: "Washington DC", lat: 38.91, lon: -77.04 },
  { city: "San Diego", lat: 32.72, lon: -117.16 },
  { city: "Dallas", lat: 32.78, lon: -96.80 },
  { city: "Minneapolis", lat: 44.98, lon: -93.27 },
];

const RELIGION_VALUES = [
  "AGNOSTIC", "ATHEIST", "BUDDHIST", "CATHOLIC", "CHRISTIAN",
  "HINDU", "JEWISH", "MUSLIM", "SPIRITUAL", "OTHER", null,
];

const POLITICS_VALUES = [
  "LIBERAL", "MODERATE", "CONSERVATIVE", "NOT_POLITICAL", null,
];

const DRINKING_VALUES = ["YES", "SOMETIMES", "NO", "SOBER", null];
const SMOKING_VALUES = ["YES", "SOMETIMES", "NO", null];
const DRUGS_VALUES = ["YES", "SOMETIMES", "NO", null];
const FAMILY_PLANS_VALUES = [
  "WANT_CHILDREN", "DONT_WANT_CHILDREN", "HAVE_AND_WANT_MORE",
  "NOT_SURE", null,
];
const ETHNICITY_VALUES = [
  "BLACK", "EAST_ASIAN", "HISPANIC_LATINO", "MIDDLE_EASTERN",
  "SOUTH_ASIAN", "SOUTHEAST_ASIAN", "WHITE", "OTHER", null,
];

// Prompt answers organized by prompt template ID
const PROMPT_ANSWERS: Record<string, string[]> = {
  pt_01: [ // A shower thought I recently had
    "If you clean a vacuum cleaner, you become the vacuum cleaner",
    "Do crabs think fish can fly?",
    "Technically, we're all just brains piloting a bone mech with meat armor",
    "What if deja vu means you lost a life and you're starting back at a checkpoint",
    "The word 'bed' actually looks like a bed",
  ],
  pt_02: [ // My simple pleasures
    "Sunday morning coffee on the balcony with a good book",
    "Finding a perfect playlist for a long drive",
    "The smell of freshly baked cookies and a warm blanket",
    "Watching the sunset from a rooftop bar",
    "A perfectly ripe avocado and fresh sourdough bread",
  ],
  pt_03: [ // I geek out on
    "Space exploration and astrophotography. Did you know there are more stars than grains of sand on Earth?",
    "True crime podcasts - I'm basically a detective at this point (minus the badge)",
    "Specialty coffee - I can tell you the exact altitude the beans were grown at",
    "Board games and strategy - Settlers of Catan champion three years running",
    "Vintage vinyl records. There's something magical about the crackle",
  ],
  pt_04: [ // My most irrational fear
    "That fish in the ocean will start walking on land. I've seen enough evolution documentaries",
    "Accidentally sending a voice note meant for my friend to my boss",
    "Dolphins are secretly plotting world domination",
    "That the barista judges me for my complicated coffee order",
    "Waking up one day and all dogs have disappeared",
  ],
  pt_05: [ // The hallmark of a good relationship is
    "Being able to sit in comfortable silence together",
    "Making each other laugh until your stomach hurts",
    "Growing together while still being your own person",
    "Being each other's biggest cheerleader",
    "Sharing dessert without fighting over the last bite (okay, maybe a little fighting)",
  ],
  pt_06: [ // I'm looking for
    "Someone who can keep up with my terrible puns and random trivia",
    "A partner in crime for weekend adventures and weeknight takeout",
    "Someone who isn't afraid to be silly and doesn't take life too seriously",
    "My equal - someone ambitious, kind, and always up for trying something new",
    "Someone to explore the city with and eventually the world",
  ],
  pt_07: [ // I'm known for
    "Making the best homemade pasta you've ever tasted",
    "Being the friend who always has a plan for the weekend",
    "My infectious laugh that you can hear from across the room",
    "Never saying no to an adventure, even on a Tuesday",
    "My elaborate Spotify playlists for every possible mood",
  ],
  pt_08: [ // Two truths and a lie
    "I've been skydiving, I speak three languages, I've never eaten sushi",
    "I can solve a Rubik's cube in under a minute, I've met a president, I own 200 houseplants",
    "I ran a marathon, I've been on TV, I can juggle five balls",
    "I've lived on three continents, I can play the piano, I'm afraid of butterflies",
    "I've swum with sharks, I was prom king/queen, I can't whistle",
  ],
  pt_09: [ // Typical Sunday
    "Farmers market in the morning, brunch with friends, afternoon hike, and cooking dinner while listening to jazz",
    "Sleep in, make fancy pancakes, read in the park, then movie night with way too much popcorn",
    "Morning yoga, long coffee, wandering through bookshops, and trying a new recipe",
    "Early run, brunch prep, video games, then dinner prep with a good podcast",
    "Beach day if sunny, museum day if rainy, pizza night either way",
  ],
  pt_10: [ // My go-to karaoke song
    "Bohemian Rhapsody - I commit to every voice",
    "Don't Stop Believin' - a crowd pleaser, every time",
    "Dancing Queen by ABBA - because I am the dancing queen",
    "Mr. Brightside - it's basically a religious experience",
    "Sweet Caroline - BAH BAH BAH",
  ],
  pt_11: [ // A life goal of mine
    "Open a small restaurant that feels like eating at a friend's house",
    "Visit every national park in the US",
    "Write a novel that actually gets published (even if only my mom reads it)",
    "Learn to surf well enough to not embarrass myself",
    "Build a cabin in the mountains and grow my own vegetables",
  ],
  pt_12: [ // A hot take I have
    "Breakfast for dinner is superior to breakfast for breakfast",
    "The movie is sometimes better than the book (please don't unfollow me)",
    "Pineapple absolutely belongs on pizza and I will die on this hill",
    "Cold pizza is better than reheated pizza",
    "Rain is actually the best weather for a date",
  ],
  pt_13: [ // The best way to ask me out is
    "Just be direct - suggest a specific time, place, and activity",
    "Send me a meme that makes you think of me and then suggest we grab coffee",
    "Tell me about an amazing restaurant you've been wanting to try",
    "Challenge me to a game or competition - I'm very competitive",
    "Quote my favorite movie and suggest we watch the sequel together",
  ],
  pt_14: [ // The way to win me over is
    "Show genuine curiosity about my passions and share yours too",
    "Make me laugh so hard I snort (it's happened, no judgment)",
    "Cook me dinner - the effort means more than the skill",
    "Be kind to strangers and tip well - that tells me everything",
    "Remember the small things I mention and surprise me later",
  ],
  pt_15: [ // My love language is
    "Quality time - let's go on an adventure or just cook dinner together",
    "Words of affirmation - tell me you appreciate me and I'll melt",
    "Acts of service - surprise me by making coffee before I wake up",
    "Physical touch - I'm a big hugger, fair warning",
    "Gift giving - not expensive things, but thoughtful ones that show you were listening",
  ],
  pt_16: [ // My most embarrassing moment
    "Waved back at someone who wasn't waving at me. In a crowded restaurant. They were a waiter.",
    "Walked into a glass door at a fancy restaurant. Left a face print. The whole restaurant saw.",
    "Sent a voice memo complaining about my date... to my date",
    "Confidently answered a question in a meeting that wasn't directed at me. In the wrong meeting.",
    "Tried to be cool leaning against a wall that turned out to be a door. Fell into a supply closet.",
  ],
  pt_17: [ // The best trip I ever took
    "Backpacking through Japan - the food, the people, the cherry blossoms. Absolute magic.",
    "Road tripping up the California coast with my best friend, no plan, just vibes",
    "A week in Amalfi Coast, Italy - the views, the pasta, the limoncello",
    "Hiking Patagonia - most beautiful place I've ever seen",
    "Christmas in Iceland - Northern Lights, hot springs, and the most incredible silence",
  ],
  pt_18: [ // An unexpected fact about me
    "I was a competitive chess player in high school and still play online every day",
    "I've read over 100 books a year for the past three years",
    "I'm a certified scuba diver who's terrified of deep water (I know, I know)",
    "I used to be a professional dancer before switching to tech",
    "I speak conversational Japanese thanks to a year-long anime obsession",
  ],
  pt_19: [ // The last thing I read that I loved
    "Project Hail Mary by Andy Weir - if you liked The Martian, this is even better",
    "Pachinko by Min Jin Lee - a sweeping, beautiful epic",
    "The Midnight Library by Matt Haig - made me rethink everything about regret",
    "Educated by Tara Westover - absolutely incredible memoir",
    "Klara and the Sun by Kazuo Ishiguro - hauntingly beautiful",
  ],
  pt_20: [ // Together, we could
    "Open a food truck that only serves breakfast tacos and cold brew",
    "Travel to every continent and rank the best coffee in each",
    "Start a podcast about our worst date stories (I have plenty of material)",
    "Finally answer the age-old question: which is the best brunch spot in the city",
    "Build the world's most epic blanket fort and binge-watch cooking shows",
  ],
  pt_21: [ // I'm convinced that
    "Dogs are the purest beings on this planet and we don't deserve them",
    "The best conversations happen after midnight",
    "There's a parallel universe where I'm a professional cheese taster",
    "Laughter is genuinely the best medicine (and also actual medicine)",
    "Everyone needs at least one hobby they're terrible at but love anyway",
  ],
  pt_22: [ // Let's debate this topic
    "Is a hot dog a sandwich? I have strong feelings about this.",
    "What came first: the chicken or the egg? I have a PowerPoint ready.",
    "Best pizza style: New York thin crust vs. Detroit deep dish vs. Neapolitan",
    "Morning person vs. night owl - which is the superior lifestyle?",
    "Should you put milk or cereal in the bowl first?",
  ],
  pt_23: [ // You should leave a comment if
    "You know the difference between good coffee and great coffee",
    "You can recommend a book that will change my life",
    "You've got a hot take about pizza that would make me gasp",
    "You want to tell me your best travel story",
    "You think you can beat me at Mario Kart (spoiler: you can't)",
  ],
  pt_24: [ // My biggest date fail
    "Took my date to a fancy restaurant and spilled an entire bowl of soup on myself within 5 minutes",
    "Got so nervous I called my date by the wrong name. Twice.",
    "Suggested mini golf. Turns out I'm competitive to a fault. There was no second date.",
    "Made a homemade dinner and set off the smoke alarm three times. We ordered pizza.",
    "Showed up at the wrong restaurant and waited 45 minutes before realizing my mistake",
  ],
  pt_25: [ // I recently discovered that
    "Making sourdough bread is basically having a high-maintenance pet",
    "I'm actually a morning person when I have something exciting to wake up for",
    "You can make incredible pasta from scratch with just flour and eggs",
    "Cold plunges are actually amazing once you get past the 'wanting to die' part",
    "I love salsa dancing and I should have started ten years ago",
  ],
  pt_26: [ // A boundary of mine is
    "I need at least one evening a week for personal recharge time - it makes me a better partner",
    "I believe in honest communication, even when it's uncomfortable",
    "I won't compromise on being treated with respect and kindness",
    "I need my partner to have their own friendships and interests",
    "I don't check my phone during dinner - undivided attention matters",
  ],
  pt_27: [ // I want someone who
    "Can laugh at themselves and doesn't take everything too seriously",
    "Is curious about the world and always wants to learn something new",
    "Values deep conversations as much as comfortable silence",
    "Isn't afraid to be vulnerable and emotionally available",
    "Will try new restaurants with me and share every dish at the table",
  ],
  pt_28: [ // Believe it or not, I
    "Once accidentally ended up at a stranger's wedding and stayed for the cake",
    "Can name every country in the world from memory (party trick: activated)",
    "Have never seen Star Wars but can recite every line from The Princess Bride",
    "Won a chili cook-off against 50 people with a recipe I made up on the spot",
    "Lived on a sailboat for three months with zero sailing experience",
  ],
};

const PROMPT_TEMPLATE_IDS = Object.keys(PROMPT_ANSWERS);

// ============================================================================
// Helper Functions
// ============================================================================

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startYear: number, endYear: number): Date {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start));
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================================
// Main Seed Function
// ============================================================================

async function main() {
  console.log("Seeding database...\n");

  // Clean existing data
  console.log("Cleaning existing data...");
  await prisma.reaction.deleteMany();
  await prisma.message.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.block.deleteMany();
  await prisma.match.deleteMany();
  await prisma.like.deleteMany();
  await prisma.prompt.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.preference.deleteMany();
  await prisma.promptTemplate.deleteMany();
  await prisma.user.deleteMany();
  console.log("Done cleaning.\n");

  // ---- Seed Prompt Templates ----
  console.log("Creating prompt templates...");
  const promptTemplates = [];
  for (const [id, answers] of Object.entries(PROMPT_ANSWERS)) {
    // Determine category from the template definitions
    let category = "ABOUT_ME";
    const num = parseInt(id.replace("pt_", ""), 10);
    if (num <= 7) category = "ABOUT_ME";
    else if (num <= 11) category = "CREATIVITY";
    else if (num <= 15) category = "OPINIONS";
    else if (num <= 19) category = "STORYTELLING";
    else if (num <= 23) category = "DATING";
    else category = "LIFESTYLE";

    const TEXT_MAP: Record<string, string> = {
      pt_01: "A shower thought I recently had",
      pt_02: "My simple pleasures",
      pt_03: "I geek out on",
      pt_04: "My most irrational fear",
      pt_05: "The hallmark of a good relationship is",
      pt_06: "I'm looking for",
      pt_07: "I'm known for",
      pt_08: "Two truths and a lie",
      pt_09: "Typical Sunday",
      pt_10: "My go-to karaoke song",
      pt_11: "A life goal of mine",
      pt_12: "A hot take I have",
      pt_13: "The best way to ask me out is",
      pt_14: "The way to win me over is",
      pt_15: "My love language is",
      pt_16: "My most embarrassing moment",
      pt_17: "The best trip I ever took",
      pt_18: "An unexpected fact about me",
      pt_19: "The last thing I read that I loved",
      pt_20: "Together, we could",
      pt_21: "I'm convinced that",
      pt_22: "Let's debate this topic",
      pt_23: "You should leave a comment if",
      pt_24: "My biggest date fail",
      pt_25: "I recently discovered that",
      pt_26: "A boundary of mine is",
      pt_27: "I want someone who",
      pt_28: "Believe it or not, I",
    };

    const template = await prisma.promptTemplate.create({
      data: {
        id,
        category,
        text: TEXT_MAP[id] || `Prompt ${id}`,
      },
    });
    promptTemplates.push(template);
  }
  console.log(`Created ${promptTemplates.length} prompt templates.\n`);

  // ---- Create Demo User ----
  console.log("Creating demo user...");
  const demoPasswordHash = await bcrypt.hash("password123", 12);
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@hinge.com",
      passwordHash: demoPasswordHash,
      firstName: "Alex",
      lastName: "Demo",
      birthday: new Date("1996-05-15"),
      gender: "MAN" as Gender,
      genderPreference: "WOMEN" as GenderPreference,
      bio: "Product designer who loves hiking, coffee, and good conversation. Looking for someone to explore the city with.",
      jobTitle: "Product Designer",
      company: "Airbnb",
      school: "Stanford University",
      hometown: "San Francisco",
      height: 180,
      religion: "AGNOSTIC",
      politics: "LIBERAL",
      drinking: "SOMETIMES",
      smoking: "NO",
      drugs: "NO",
      familyPlans: "WANT_CHILDREN",
      ethnicity: "WHITE",
      latitude: 37.77,
      longitude: -122.42,
      isVerified: true,
      isActive: true,
      isPaused: false,
      profileComplete: true,
      lastActiveAt: new Date(),
    },
  });

  // Demo user photos
  for (let i = 1; i <= 6; i++) {
    await prisma.photo.create({
      data: {
        userId: demoUser.id,
        url: `https://picsum.photos/seed/demo${i}/600/800`,
        position: i,
      },
    });
  }

  // Demo user prompts
  const demoPromptTemplates = shuffleArray(PROMPT_TEMPLATE_IDS).slice(0, 3);
  for (let i = 0; i < 3; i++) {
    const templateId = demoPromptTemplates[i];
    const answers = PROMPT_ANSWERS[templateId];
    await prisma.prompt.create({
      data: {
        userId: demoUser.id,
        promptTemplateId: templateId,
        answer: randomElement(answers),
        position: i + 1,
      },
    });
  }

  // Demo user preferences
  await prisma.preference.create({
    data: {
      userId: demoUser.id,
      ageMin: 22,
      ageMax: 35,
      distanceMax: 25,
    },
  });

  console.log(`Demo user created: ${demoUser.email} / password123\n`);

  // ---- Create 50 Fake Users ----
  console.log("Creating fake users...");
  const allUsers: { id: string; gender: Gender }[] = [
    { id: demoUser.id, gender: demoUser.gender! },
  ];

  for (let i = 0; i < 50; i++) {
    const isWoman = i < 30; // Create 30 women and 20 men for variety
    const gender: Gender = isWoman
      ? (i % 15 === 0 ? "NON_BINARY" : "WOMAN")
      : (i % 10 === 0 ? "NON_BINARY" : "MAN");
    const firstName = isWoman
      ? FIRST_NAMES_WOMEN[i % FIRST_NAMES_WOMEN.length]
      : FIRST_NAMES_MEN[(i - 30) % FIRST_NAMES_MEN.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const location = randomElement(LOCATIONS);
    const birthday = randomDate(1984, 2002); // ages roughly 22-40
    const genderPreference: GenderPreference =
      isWoman
        ? randomElement(["MEN", "MEN", "MEN", "EVERYONE"] as GenderPreference[])
        : randomElement(["WOMEN", "WOMEN", "WOMEN", "EVERYONE"] as GenderPreference[]);

    const passwordHash = await bcrypt.hash("password123", 10);

    const user = await prisma.user.create({
      data: {
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
        passwordHash,
        firstName,
        lastName,
        birthday,
        gender,
        genderPreference,
        bio: randomElement([
          `${randomElement(JOB_TITLES)} by day, ${randomElement(["home chef", "yoga enthusiast", "amateur photographer", "bookworm", "music lover", "dog parent"])} by night.`,
          `Living in ${location.city} and loving it. Always up for trying new restaurants and going on adventures.`,
          `Just a ${firstName} trying to find someone who laughs at my jokes. Fair warning: they're mostly puns.`,
          null,
          `Coffee addict. Travel junkie. Looking for my person.`,
          `${location.city} transplant from ${randomElement(LOCATIONS).city}. Love hiking, brunch, and spontaneous road trips.`,
        ]),
        jobTitle: randomElement(JOB_TITLES),
        company: randomElement(COMPANIES),
        school: randomElement(SCHOOLS),
        hometown: randomElement(LOCATIONS).city,
        height: isWoman ? randomInt(155, 180) : randomInt(170, 198),
        religion: randomElement(RELIGION_VALUES),
        politics: randomElement(POLITICS_VALUES),
        drinking: randomElement(DRINKING_VALUES),
        smoking: randomElement(SMOKING_VALUES),
        drugs: randomElement(DRUGS_VALUES),
        familyPlans: randomElement(FAMILY_PLANS_VALUES),
        ethnicity: randomElement(ETHNICITY_VALUES),
        latitude: location.lat + (Math.random() - 0.5) * 0.1,
        longitude: location.lon + (Math.random() - 0.5) * 0.1,
        isVerified: Math.random() > 0.6,
        isActive: true,
        isPaused: i === 48, // One paused user
        profileComplete: i !== 49, // One incomplete profile
        lastActiveAt: new Date(
          Date.now() - randomInt(0, 7 * 24 * 60 * 60 * 1000)
        ),
      },
    });

    allUsers.push({ id: user.id, gender: user.gender! });

    // Photos (6 per user, different picsum seeds)
    for (let j = 1; j <= 6; j++) {
      await prisma.photo.create({
        data: {
          userId: user.id,
          url: `https://picsum.photos/seed/user${i}photo${j}/600/800`,
          position: j,
        },
      });
    }

    // Prompts (3 per user)
    const userPromptTemplates = shuffleArray(PROMPT_TEMPLATE_IDS).slice(0, 3);
    for (let j = 0; j < 3; j++) {
      const templateId = userPromptTemplates[j];
      const answers = PROMPT_ANSWERS[templateId];
      await prisma.prompt.create({
        data: {
          userId: user.id,
          promptTemplateId: templateId,
          answer: randomElement(answers),
          position: j + 1,
        },
      });
    }

    // Preferences
    await prisma.preference.create({
      data: {
        userId: user.id,
        ageMin: randomInt(18, 25),
        ageMax: randomInt(30, 45),
        distanceMax: randomElement([10, 25, 50, 100]),
      },
    });
  }

  console.log(`Created ${allUsers.length - 1} fake users.\n`);

  // ---- Create Pre-existing Likes ----
  console.log("Creating likes...");
  const createdLikePairs = new Set<string>();
  let likeCount = 0;

  // Create some likes from other users to the demo user
  const otherUsers = allUsers.filter((u) => u.id !== demoUser.id);
  const likersToDemo = shuffleArray(otherUsers).slice(0, 15);

  for (const liker of likersToDemo) {
    const pairKey = `${liker.id}-${demoUser.id}`;
    if (createdLikePairs.has(pairKey)) continue;
    createdLikePairs.add(pairKey);

    const photos = await prisma.photo.findMany({
      where: { userId: demoUser.id },
      take: 1,
    });

    const prompts = await prisma.prompt.findMany({
      where: { userId: demoUser.id },
      take: 1,
    });

    const usePhoto = Math.random() > 0.5 && photos.length > 0;
    const target = usePhoto ? photos[0] : prompts[0];
    if (!target) continue;

    await prisma.like.create({
      data: {
        fromUserId: liker.id,
        toUserId: demoUser.id,
        targetType: usePhoto ? "PHOTO" as LikeTargetType : "PROMPT" as LikeTargetType,
        targetId: target.id,
        comment: Math.random() > 0.5
          ? randomElement([
              "Love this!",
              "This is great",
              "We have so much in common!",
              "Your vibe is amazing",
              "Would love to chat!",
              "This made me smile",
            ])
          : null,
        isRose: Math.random() > 0.85,
        status: "PENDING",
        createdAt: new Date(Date.now() - randomInt(0, 3 * 24 * 60 * 60 * 1000)),
      },
    });
    likeCount++;
  }

  // Create random likes between other users
  for (let i = 0; i < 40; i++) {
    const from = randomElement(otherUsers);
    const to = randomElement(allUsers.filter((u) => u.id !== from.id));
    const pairKey = `${from.id}-${to.id}`;
    if (createdLikePairs.has(pairKey)) continue;
    createdLikePairs.add(pairKey);

    const photos = await prisma.photo.findMany({
      where: { userId: to.id },
      take: 1,
    });

    if (photos.length === 0) continue;

    await prisma.like.create({
      data: {
        fromUserId: from.id,
        toUserId: to.id,
        targetType: "PHOTO" as LikeTargetType,
        targetId: photos[0].id,
        comment: Math.random() > 0.6 ? randomElement(["Nice!", "Love it!", "Great photo"]) : null,
        isRose: false,
        status: "PENDING",
        createdAt: new Date(Date.now() - randomInt(0, 5 * 24 * 60 * 60 * 1000)),
      },
    });
    likeCount++;
  }

  console.log(`Created ${likeCount} likes.\n`);

  // ---- Create Pre-existing Matches ----
  console.log("Creating matches...");
  const createdMatchPairs = new Set<string>();
  let matchCount = 0;

  // Create some matches for the demo user
  const matchPartnersForDemo = shuffleArray(otherUsers).slice(0, 5);

  for (const partner of matchPartnersForDemo) {
    const user1Id = demoUser.id < partner.id ? demoUser.id : partner.id;
    const user2Id = demoUser.id < partner.id ? partner.id : demoUser.id;
    const matchPairKey = `${user1Id}-${user2Id}`;
    if (createdMatchPairs.has(matchPairKey)) continue;
    createdMatchPairs.add(matchPairKey);

    // Create reciprocal likes for the match
    const fromKey = `${demoUser.id}-${partner.id}`;
    const toKey = `${partner.id}-${demoUser.id}`;

    const demoPhotos = await prisma.photo.findMany({
      where: { userId: demoUser.id },
      take: 1,
    });
    const partnerPhotos = await prisma.photo.findMany({
      where: { userId: partner.id },
      take: 1,
    });

    if (demoPhotos.length > 0 && partnerPhotos.length > 0) {
      if (!createdLikePairs.has(fromKey)) {
        await prisma.like.create({
          data: {
            fromUserId: demoUser.id,
            toUserId: partner.id,
            targetType: "PHOTO" as LikeTargetType,
            targetId: partnerPhotos[0].id,
            status: "MATCHED",
          },
        });
        createdLikePairs.add(fromKey);
      } else {
        await prisma.like.updateMany({
          where: { fromUserId: demoUser.id, toUserId: partner.id },
          data: { status: "MATCHED" },
        });
      }

      if (!createdLikePairs.has(toKey)) {
        await prisma.like.create({
          data: {
            fromUserId: partner.id,
            toUserId: demoUser.id,
            targetType: "PHOTO" as LikeTargetType,
            targetId: demoPhotos[0].id,
            status: "MATCHED",
          },
        });
        createdLikePairs.add(toKey);
      } else {
        await prisma.like.updateMany({
          where: { fromUserId: partner.id, toUserId: demoUser.id },
          data: { status: "MATCHED" },
        });
      }
    }

    const matchedAt = new Date(
      Date.now() - randomInt(1 * 24 * 60 * 60 * 1000, 14 * 24 * 60 * 60 * 1000)
    );

    await prisma.match.create({
      data: {
        user1Id,
        user2Id,
        matchedAt,
        isActive: true,
      },
    });
    matchCount++;
  }

  // Create some matches between other users
  for (let i = 0; i < 10; i++) {
    const u1 = randomElement(otherUsers);
    const u2 = randomElement(otherUsers.filter((u) => u.id !== u1.id));
    const user1Id = u1.id < u2.id ? u1.id : u2.id;
    const user2Id = u1.id < u2.id ? u2.id : u1.id;
    const matchPairKey = `${user1Id}-${user2Id}`;
    if (createdMatchPairs.has(matchPairKey)) continue;
    createdMatchPairs.add(matchPairKey);

    await prisma.match.create({
      data: {
        user1Id,
        user2Id,
        matchedAt: new Date(Date.now() - randomInt(0, 14 * 24 * 60 * 60 * 1000)),
        isActive: true,
      },
    });
    matchCount++;
  }

  console.log(`Created ${matchCount} matches.\n`);

  // ---- Create Message Threads ----
  console.log("Creating message threads...");
  let messageCount = 0;

  const demoMatches = await prisma.match.findMany({
    where: {
      OR: [{ user1Id: demoUser.id }, { user2Id: demoUser.id }],
      isActive: true,
    },
  });

  const conversationStarters = [
    "Hey! I loved your profile",
    "Hi there! Your prompt about {topic} really caught my eye",
    "Hey! We should definitely grab coffee sometime",
    "Your photos are amazing! Where was that taken?",
    "I see we both love hiking - any favorite trails?",
  ];

  const conversationReplies = [
    "Thanks! I really liked yours too! What do you do for fun?",
    "Aw that's so sweet, thank you! What part of town are you in?",
    "I'd love that! There's a great spot near Union Square",
    "That was in Joshua Tree! Have you been?",
    "Yes! I love the trails in Marin. Have you been to Muir Woods?",
    "Haha thanks! So what are you up to this weekend?",
    "That's cool! I've actually been wanting to try that",
    "Same here! We should definitely check it out together",
  ];

  const furtherMessages = [
    "That sounds amazing! I've always wanted to go there",
    "I'm free this Saturday if you want to grab brunch?",
    "Definitely! Let me know what works for your schedule",
    "I love that place! Their avocado toast is incredible",
    "Haha yes! We clearly have great taste",
    "So tell me more about yourself - what's your favorite thing about the city?",
    "That's a great question. I'd say the food scene and the parks. You?",
    "For me it's the energy - there's always something happening",
  ];

  for (const match of demoMatches) {
    const otherUserId =
      match.user1Id === demoUser.id ? match.user2Id : match.user1Id;

    const numMessages = randomInt(3, 12);
    const startTime = match.matchedAt.getTime();
    const timeIncrement = (Date.now() - startTime) / (numMessages + 1);

    for (let j = 0; j < numMessages; j++) {
      const isFromDemo = j % 2 === 0;
      const senderId = isFromDemo ? demoUser.id : otherUserId;

      let content: string;
      if (j === 0) {
        content = randomElement(conversationStarters);
      } else if (j === 1) {
        content = randomElement(conversationReplies);
      } else {
        content = randomElement(furtherMessages);
      }

      const createdAt = new Date(startTime + timeIncrement * (j + 1));

      await prisma.message.create({
        data: {
          matchId: match.id,
          senderId,
          content,
          type: "TEXT",
          readAt: j < numMessages - 1 ? createdAt : null, // Last message unread
          createdAt,
        },
      });
      messageCount++;
    }
  }

  // Create some messages for other matches
  const otherMatches = await prisma.match.findMany({
    where: {
      user1Id: { not: demoUser.id },
      user2Id: { not: demoUser.id },
      isActive: true,
    },
    take: 5,
  });

  for (const match of otherMatches) {
    const numMessages = randomInt(2, 6);
    const startTime = match.matchedAt.getTime();
    const timeIncrement = (Date.now() - startTime) / (numMessages + 1);

    for (let j = 0; j < numMessages; j++) {
      const senderId = j % 2 === 0 ? match.user1Id : match.user2Id;
      const createdAt = new Date(startTime + timeIncrement * (j + 1));

      await prisma.message.create({
        data: {
          matchId: match.id,
          senderId,
          content: randomElement([
            ...conversationStarters,
            ...conversationReplies,
            ...furtherMessages,
          ]),
          type: "TEXT",
          readAt: j < numMessages - 1 ? createdAt : null,
          createdAt,
        },
      });
      messageCount++;
    }
  }

  console.log(`Created ${messageCount} messages.\n`);

  // ---- Create Notifications ----
  console.log("Creating notifications for demo user...");
  const notificationTypes = [
    {
      type: "NEW_LIKE",
      title: "Someone liked you!",
      body: "Check your likes to see who",
    },
    {
      type: "NEW_MATCH",
      title: "New Match!",
      body: "You have a new match. Start a conversation!",
    },
    {
      type: "NEW_MESSAGE",
      title: "New Message",
      body: "You have an unread message",
    },
    {
      type: "DAILY_PICKS",
      title: "Daily Picks",
      body: "Your daily picks are ready. Check them out!",
    },
  ];

  for (let i = 0; i < 8; i++) {
    const notif = randomElement(notificationTypes);
    await prisma.notification.create({
      data: {
        userId: demoUser.id,
        type: notif.type,
        title: notif.title,
        body: notif.body,
        isRead: i > 3, // First 4 unread
        createdAt: new Date(
          Date.now() - randomInt(0, 7 * 24 * 60 * 60 * 1000)
        ),
      },
    });
  }

  console.log("Created 8 notifications.\n");

  // ---- Summary ----
  const totalUsers = await prisma.user.count();
  const totalPhotos = await prisma.photo.count();
  const totalPrompts = await prisma.prompt.count();
  const totalLikes = await prisma.like.count();
  const totalMatches = await prisma.match.count();
  const totalMessages = await prisma.message.count();
  const totalNotifications = await prisma.notification.count();

  console.log("========================================");
  console.log("  Seed Complete!");
  console.log("========================================");
  console.log(`  Users:          ${totalUsers}`);
  console.log(`  Photos:         ${totalPhotos}`);
  console.log(`  Prompt Templates: ${promptTemplates.length}`);
  console.log(`  Prompts:        ${totalPrompts}`);
  console.log(`  Likes:          ${totalLikes}`);
  console.log(`  Matches:        ${totalMatches}`);
  console.log(`  Messages:       ${totalMessages}`);
  console.log(`  Notifications:  ${totalNotifications}`);
  console.log("========================================");
  console.log(`\n  Demo account: demo@hinge.com / password123\n`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
