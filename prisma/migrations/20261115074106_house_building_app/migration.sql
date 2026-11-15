-- CreateTable
CREATE TABLE "SiteLog" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperature" DOUBLE PRECISION,
    "weatherDesc" TEXT,
    "windSpeed" DOUBLE PRECISION,
    "notes" TEXT NOT NULL,
    "workType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SiteLog" ADD CONSTRAINT "SiteLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
