-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MAN', 'WOMAN', 'NON_BINARY', 'TRANSGENDER_MAN', 'TRANSGENDER_WOMAN', 'OTHER');

-- CreateEnum
CREATE TYPE "GenderPreference" AS ENUM ('MEN', 'WOMEN', 'EVERYONE');

-- CreateEnum
CREATE TYPE "LikeTargetType" AS ENUM ('PHOTO', 'PROMPT');

-- CreateEnum
CREATE TYPE "LikeStatus" AS ENUM ('PENDING', 'MATCHED', 'SKIPPED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'GIF', 'SYSTEM');

-- CreateEnum
CREATE TYPE "WeMet" AS ENUM ('YES', 'NO');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'ACTIONED', 'DISMISSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthday" TIMESTAMP(3),
    "gender" "Gender",
    "genderPreference" "GenderPreference",
    "bio" TEXT,
    "jobTitle" TEXT,
    "company" TEXT,
    "school" TEXT,
    "hometown" TEXT,
    "height" INTEGER,
    "religion" TEXT,
    "politics" TEXT,
    "drinking" TEXT,
    "smoking" TEXT,
    "drugs" TEXT,
    "familyPlans" TEXT,
    "ethnicity" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "isVerification" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptTemplate" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "PromptTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prompt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promptTemplateId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "voiceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prompt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ageMin" INTEGER NOT NULL DEFAULT 18,
    "ageMax" INTEGER NOT NULL DEFAULT 99,
    "distanceMax" INTEGER NOT NULL DEFAULT 25,
    "heightMin" INTEGER,
    "heightMax" INTEGER,
    "ethnicity" TEXT,
    "religion" TEXT,
    "politics" TEXT,
    "drinking" TEXT,
    "smoking" TEXT,
    "familyPlans" TEXT,
    "ethnicityDealbreaker" BOOLEAN NOT NULL DEFAULT false,
    "religionDealbreaker" BOOLEAN NOT NULL DEFAULT false,
    "politicsDealbreaker" BOOLEAN NOT NULL DEFAULT false,
    "drinkingDealbreaker" BOOLEAN NOT NULL DEFAULT false,
    "smokingDealbreaker" BOOLEAN NOT NULL DEFAULT false,
    "familyPlansDealbreaker" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "targetType" "LikeTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "comment" TEXT,
    "isRose" BOOLEAN NOT NULL DEFAULT false,
    "status" "LikeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "user1Id" TEXT NOT NULL,
    "user2Id" TEXT NOT NULL,
    "matchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "weMet" "WeMet",
    "weMetFeedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_phone_idx" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_gender_idx" ON "User"("gender");

-- CreateIndex
CREATE INDEX "User_isActive_isPaused_profileComplete_idx" ON "User"("isActive", "isPaused", "profileComplete");

-- CreateIndex
CREATE INDEX "User_latitude_longitude_idx" ON "User"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "User_lastActiveAt_idx" ON "User"("lastActiveAt");

-- CreateIndex
CREATE INDEX "Photo_userId_idx" ON "Photo"("userId");

-- CreateIndex
CREATE INDEX "Photo_userId_position_idx" ON "Photo"("userId", "position");

-- CreateIndex
CREATE INDEX "PromptTemplate_category_idx" ON "PromptTemplate"("category");

-- CreateIndex
CREATE INDEX "Prompt_userId_idx" ON "Prompt"("userId");

-- CreateIndex
CREATE INDEX "Prompt_userId_position_idx" ON "Prompt"("userId", "position");

-- CreateIndex
CREATE INDEX "Prompt_promptTemplateId_idx" ON "Prompt"("promptTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "Preference_userId_key" ON "Preference"("userId");

-- CreateIndex
CREATE INDEX "Preference_userId_idx" ON "Preference"("userId");

-- CreateIndex
CREATE INDEX "Like_fromUserId_idx" ON "Like"("fromUserId");

-- CreateIndex
CREATE INDEX "Like_toUserId_idx" ON "Like"("toUserId");

-- CreateIndex
CREATE INDEX "Like_toUserId_status_idx" ON "Like"("toUserId", "status");

-- CreateIndex
CREATE INDEX "Like_status_idx" ON "Like"("status");

-- CreateIndex
CREATE INDEX "Like_createdAt_idx" ON "Like"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Like_fromUserId_toUserId_key" ON "Like"("fromUserId", "toUserId");

-- CreateIndex
CREATE INDEX "Match_user1Id_idx" ON "Match"("user1Id");

-- CreateIndex
CREATE INDEX "Match_user2Id_idx" ON "Match"("user2Id");

-- CreateIndex
CREATE INDEX "Match_isActive_idx" ON "Match"("isActive");

-- CreateIndex
CREATE INDEX "Match_matchedAt_idx" ON "Match"("matchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Match_user1Id_user2Id_key" ON "Match"("user1Id", "user2Id");

-- CreateIndex
CREATE INDEX "Message_matchId_idx" ON "Message"("matchId");

-- CreateIndex
CREATE INDEX "Message_matchId_createdAt_idx" ON "Message"("matchId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_readAt_idx" ON "Message"("readAt");

-- CreateIndex
CREATE INDEX "Reaction_messageId_idx" ON "Reaction"("messageId");

-- CreateIndex
CREATE INDEX "Reaction_userId_idx" ON "Reaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Reaction_messageId_userId_key" ON "Reaction"("messageId", "userId");

-- CreateIndex
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");

-- CreateIndex
CREATE INDEX "Report_reportedUserId_idx" ON "Report"("reportedUserId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Block_blockerId_idx" ON "Block"("blockerId");

-- CreateIndex
CREATE INDEX "Block_blockedUserId_idx" ON "Block"("blockedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Block_blockerId_blockedUserId_key" ON "Block"("blockerId", "blockedUserId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prompt" ADD CONSTRAINT "Prompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prompt" ADD CONSTRAINT "Prompt_promptTemplateId_fkey" FOREIGN KEY ("promptTemplateId") REFERENCES "PromptTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preference" ADD CONSTRAINT "Preference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Like" ADD CONSTRAINT "Like_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction" ADD CONSTRAINT "Reaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedUserId_fkey" FOREIGN KEY ("blockedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
