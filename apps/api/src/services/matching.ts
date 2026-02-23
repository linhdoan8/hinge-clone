import prisma from "../utils/prisma.js";

interface UserLike {
  id: string;
  birthday: Date | null;
  gender: string | null;
  genderPreference: string | null;
  latitude: number | null;
  longitude: number | null;
  religion: string | null;
  politics: string | null;
  drinking: string | null;
  smoking: string | null;
  drugs: string | null;
  familyPlans: string | null;
  ethnicity: string | null;
  hometown: string | null;
  school: string | null;
  height: number | null;
}

/**
 * Calculate a compatibility score between two users (0-100).
 * Factors:
 * - Location proximity (up to 25 points)
 * - Age proximity (up to 15 points)
 * - Shared identity values (up to 30 points)
 * - Shared lifestyle traits (up to 20 points)
 * - Shared background (up to 10 points)
 */
export function calculateCompatibility(
  user1: UserLike,
  user2: UserLike
): number {
  let score = 0;

  // ---- Location Proximity (up to 25 points) ----
  if (
    user1.latitude !== null &&
    user1.longitude !== null &&
    user2.latitude !== null &&
    user2.longitude !== null
  ) {
    const distance = haversineDistanceMiles(
      user1.latitude,
      user1.longitude,
      user2.latitude,
      user2.longitude
    );

    if (distance <= 5) {
      score += 25;
    } else if (distance <= 10) {
      score += 20;
    } else if (distance <= 25) {
      score += 15;
    } else if (distance <= 50) {
      score += 10;
    } else if (distance <= 100) {
      score += 5;
    }
    // > 100 miles = 0 location points
  }

  // ---- Age Proximity (up to 15 points) ----
  if (user1.birthday && user2.birthday) {
    const age1 = calculateAge(user1.birthday);
    const age2 = calculateAge(user2.birthday);
    const ageDiff = Math.abs(age1 - age2);

    if (ageDiff <= 2) {
      score += 15;
    } else if (ageDiff <= 5) {
      score += 12;
    } else if (ageDiff <= 8) {
      score += 8;
    } else if (ageDiff <= 12) {
      score += 4;
    }
    // > 12 years = 0 age points
  }

  // ---- Identity Values (up to 30 points, 6 points each) ----
  const identityFields: (keyof UserLike)[] = [
    "religion",
    "politics",
    "familyPlans",
    "drinking",
    "smoking",
  ];

  for (const field of identityFields) {
    const val1 = user1[field];
    const val2 = user2[field];
    if (val1 && val2 && val1 === val2) {
      score += 6;
    }
  }

  // ---- Height Compatibility (up to 10 points) ----
  // Mild bonus if heights are within a complementary range
  if (user1.height && user2.height) {
    const heightDiff = Math.abs(user1.height - user2.height);
    if (heightDiff <= 15) {
      score += 10;
    } else if (heightDiff <= 25) {
      score += 6;
    } else if (heightDiff <= 35) {
      score += 3;
    }
  }

  // ---- Shared Background (up to 10 points) ----
  // Same hometown
  if (
    user1.hometown &&
    user2.hometown &&
    user1.hometown.toLowerCase() === user2.hometown.toLowerCase()
  ) {
    score += 5;
  }

  // Same school
  if (
    user1.school &&
    user2.school &&
    user1.school.toLowerCase() === user2.school.toLowerCase()
  ) {
    score += 5;
  }

  // ---- Ethnicity match (up to 10 points) ----
  if (
    user1.ethnicity &&
    user2.ethnicity &&
    user1.ethnicity === user2.ethnicity
  ) {
    score += 10;
  }

  // Cap at 100
  return Math.min(score, 100);
}

/**
 * Find the most compatible user for a given userId.
 * Evaluates a pool of candidates and returns the highest scored one.
 */
export async function getMostCompatible(
  userId: string
): Promise<{ userId: string; score: number } | null> {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { preference: true },
  });

  if (!currentUser) return null;

  // Get IDs to exclude
  const [sentLikeIds, matchedIds, blockedIds, blockedByIds] =
    await Promise.all([
      prisma.like.findMany({
        where: { fromUserId: userId },
        select: { toUserId: true },
      }),
      prisma.match.findMany({
        where: {
          OR: [{ user1Id: userId }, { user2Id: userId }],
          isActive: true,
        },
        select: { user1Id: true, user2Id: true },
      }),
      prisma.block.findMany({
        where: { blockerId: userId },
        select: { blockedUserId: true },
      }),
      prisma.block.findMany({
        where: { blockedUserId: userId },
        select: { blockerId: true },
      }),
    ]);

  const excludeIds = new Set<string>();
  excludeIds.add(userId);
  sentLikeIds.forEach((l) => excludeIds.add(l.toUserId));
  matchedIds.forEach((m) =>
    excludeIds.add(m.user1Id === userId ? m.user2Id : m.user1Id)
  );
  blockedIds.forEach((b) => excludeIds.add(b.blockedUserId));
  blockedByIds.forEach((b) => excludeIds.add(b.blockerId));

  // Build gender filter
  let genders: string[] | undefined;
  if (currentUser.genderPreference === "MEN") {
    genders = ["MAN", "TRANSGENDER_MAN"];
  } else if (currentUser.genderPreference === "WOMEN") {
    genders = ["WOMAN", "TRANSGENDER_WOMAN"];
  }

  const whereCondition: Record<string, unknown> = {
    id: { notIn: Array.from(excludeIds) },
    isActive: true,
    isPaused: false,
    profileComplete: true,
  };

  if (genders) {
    whereCondition.gender = { in: genders };
  }

  const candidates = await prisma.user.findMany({
    where: whereCondition,
    take: 100,
  });

  if (candidates.length === 0) return null;

  let bestUserId = candidates[0].id;
  let bestScore = -1;

  for (const candidate of candidates) {
    const score = calculateCompatibility(currentUser, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestUserId = candidate.id;
    }
  }

  return { userId: bestUserId, score: bestScore };
}

// ============================================================================
// Internal helpers
// ============================================================================

function haversineDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateAge(birthday: Date): number {
  return Math.floor(
    (Date.now() - birthday.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  );
}
