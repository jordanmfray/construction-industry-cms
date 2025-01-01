-- CreateTable
CREATE TABLE "Company" (
    "Id" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "WebsiteUrl" TEXT,
    "GooglePlaceId" TEXT,
    "AddressStreet" TEXT,
    "AddressCity" TEXT,
    "AddressState" TEXT,
    "AddressZip" TEXT,
    "Description" TEXT,
    "Rating" DOUBLE PRECISION,
    "Services" JSONB,
    "UrlsToScrape" JSONB,
    "WebsiteContent" JSONB,
    "WebsiteImages" JSONB,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("Id")
);

-- CreateTable
CREATE TABLE "Webpage" (
    "Id" SERIAL NOT NULL,
    "Url" TEXT NOT NULL,
    "Html" TEXT,
    "Content" TEXT,
    "Images" JSONB,
    "Urls" JSONB,
    "Metrics" JSONB,
    "CompanyId" INTEGER NOT NULL,

    CONSTRAINT "Webpage_pkey" PRIMARY KEY ("Id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_WebsiteUrl_key" ON "Company"("WebsiteUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Company_GooglePlaceId_key" ON "Company"("GooglePlaceId");

-- AddForeignKey
ALTER TABLE "Webpage" ADD CONSTRAINT "Webpage_CompanyId_fkey" FOREIGN KEY ("CompanyId") REFERENCES "Company"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
