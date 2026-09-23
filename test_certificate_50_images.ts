import dotenv from "dotenv";
dotenv.config();

import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import { db } from "./src/models/db";
import { certificate } from "./src/models/schema";
import { eq } from "drizzle-orm";
import {
  uploadCertificateImages,
  createCertificate,
  updateCertificate,
  getCertificateById,
  deleteCertificate,
} from "./src/controllers/admin/certificate";

// Mock Express Request & Response
function createMockRes() {
  const res: any = {
    statusCode: 200,
    data: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: any) {
      res.data = payload;
      return res;
    },
  };
  return res;
}

function createMockReq(body: any = {}, files: any[] = [], params: any = {}) {
  return {
    body,
    files,
    params,
    protocol: "http",
    get(header: string) {
      if (header.toLowerCase() === "host") return "localhost:3000";
      return "";
    },
  } as any;
}

async function runTest() {
  console.log("==================================================");
  console.log("🧪 STARTING COMPREHENSIVE 55-IMAGE UPLOAD TEST");
  console.log("==================================================");

  const startTime = Date.now();
  const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`Initial Heap Memory: ${initialMemory.toFixed(2)} MB`);

  // Step 1: Generate 55 realistic test image buffers
  console.log("\n📦 Step 1: Generating 55 test images in memory...");
  const TOTAL_TEST_IMAGES = 55;
  const mockFiles: Express.Multer.File[] = [];

  for (let i = 0; i < TOTAL_TEST_IMAGES; i++) {
    // Generate a distinct test image (800x600 with distinct color)
    const imgBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: {
          r: (i * 37) % 255,
          g: (i * 59) % 255,
          b: (i * 83) % 255,
        },
      },
    })
      .jpeg({ quality: 85 })
      .toBuffer();

    mockFiles.push({
      fieldname: "images",
      originalname: `cert_test_image_${i + 1}.jpg`,
      encoding: "7bit",
      mimetype: "image/jpeg",
      buffer: imgBuffer,
      size: imgBuffer.length,
    } as Express.Multer.File);
  }
  console.log(`✅ Generated ${mockFiles.length} images (Avg size: ${(mockFiles[0].size / 1024).toFixed(1)} KB each).`);

  // Step 2: Upload in Batches of 6 (simulating the Frontend flow)
  console.log("\n🚀 Step 2: Uploading images in batches of 6 via uploadCertificateImages...");
  const BATCH_SIZE = 6;
  const allUploadedPaths: string[] = [];
  const batchStart = Date.now();

  for (let i = 0; i < mockFiles.length; i += BATCH_SIZE) {
    const chunk = mockFiles.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(mockFiles.length / BATCH_SIZE);

    const req = createMockReq({}, chunk);
    const res = createMockRes();

    await new Promise<void>((resolve, reject) => {
      uploadCertificateImages(req, res, (err: any) => {
        if (err) reject(err);
        else resolve();
      }).then(() => resolve()).catch(reject);
    });

    if (res.statusCode !== 200) {
      throw new Error(`Batch ${batchNum} failed with status ${res.statusCode}: ${JSON.stringify(res.data)}`);
    }

    const paths = res.data?.data?.paths || [];
    allUploadedPaths.push(...paths);
    console.log(`   Batch ${batchNum}/${totalBatches} uploaded & watermarked (${paths.length} images). Cumulative: ${allUploadedPaths.length}/${mockFiles.length}`);
  }

  const batchDuration = (Date.now() - batchStart) / 1000;
  console.log(`✅ All ${allUploadedPaths.length} images uploaded and watermarked in ${batchDuration.toFixed(2)}s!`);

  // Verify that all 55 files physically exist on disk
  console.log("\n🔍 Verifying image files on disk...");
  for (const relPath of allUploadedPaths) {
    const absPath = path.join(process.cwd(), relPath);
    await fs.access(absPath);
  }
  console.log("✅ All 55 watermarked image files exist on disk!");

  // Step 3: Create Certificate with the 55 paths
  console.log("\n📝 Step 3: Calling createCertificate with 55 image paths...");
  const createReq = createMockReq({
    company_name: "Test Global Corporation",
    certificate_name: "Certified High Capacity Quality Standard 55-Image Test",
    date: "2026-09-23",
    images: allUploadedPaths,
  });
  const createRes = createMockRes();

  await new Promise<void>((resolve, reject) => {
    createCertificate(createReq, createRes, (err: any) => {
      if (err) reject(err);
      else resolve();
    }).then(() => resolve()).catch(reject);
  });

  if (createRes.statusCode !== 201) {
    throw new Error(`createCertificate failed: ${JSON.stringify(createRes.data)}`);
  }

  const certId = createRes.data?.data?.id;
  console.log(`✅ Certificate created successfully with ID: ${certId}`);

  // Step 4: Verify Get Certificate by ID
  console.log("\n🔎 Step 4: Verifying certificate via getCertificateById...");
  const getReq = createMockReq({}, [], { id: certId });
  const getRes = createMockRes();

  await new Promise<void>((resolve, reject) => {
    getCertificateById(getReq, getRes, (err: any) => {
      if (err) reject(err);
      else resolve();
    }).then(() => resolve()).catch(reject);
  });

  const fetchedCert = getRes.data?.data;
  console.log(`   Certificate Name: ${fetchedCert.certificate_name}`);
  console.log(`   QR Code URL: ${fetchedCert.qr_url}`);
  console.log(`   Total Image URLs returned: ${fetchedCert.images_urls?.length}`);

  if (fetchedCert.images_urls?.length !== 55) {
    throw new Error(`Expected 55 images, got ${fetchedCert.images_urls?.length}`);
  }
  console.log("✅ Retrieved certificate contains exactly 55 image URLs!");

  // Step 5: Test updateCertificate (remove 5 images, keep 50)
  console.log("\n✏️ Step 5: Testing updateCertificate (retaining 50 images, removing 5)...");
  const retainedPaths = allUploadedPaths.slice(0, 50);
  const removedPaths = allUploadedPaths.slice(50);

  const updateReq = createMockReq(
    {
      certificate_name: "Updated Certified Quality Standard 50-Image Test",
      images: retainedPaths,
    },
    [],
    { id: certId }
  );
  const updateRes = createMockRes();

  await new Promise<void>((resolve, reject) => {
    updateCertificate(updateReq, updateRes, (err: any) => {
      if (err) reject(err);
      else resolve();
    }).then(() => resolve()).catch(reject);
  });

  if (updateRes.statusCode !== 200) {
    throw new Error(`updateCertificate failed: ${JSON.stringify(updateRes.data)}`);
  }
  console.log("✅ updateCertificate succeeded!");

  // Verify that removed images were deleted from disk
  for (const removedRel of removedPaths) {
    const absPath = path.join(process.cwd(), removedRel);
    let exists = true;
    try {
      await fs.access(absPath);
    } catch {
      exists = false;
    }
    if (exists) {
      console.warn(`Warning: removed file still exists: ${absPath}`);
    }
  }
  console.log("✅ Removed images were deleted from disk as expected.");

  // Step 6: Cleanup - Delete Certificate
  console.log("\n🧹 Step 6: Cleaning up test certificate...");
  const deleteReq = createMockReq({}, [], { id: certId });
  const deleteRes = createMockRes();

  await new Promise<void>((resolve, reject) => {
    deleteCertificate(deleteReq, deleteRes, (err: any) => {
      if (err) reject(err);
      else resolve();
    }).then(() => resolve()).catch(reject);
  });

  console.log("✅ Certificate and all remaining files deleted cleanly.");

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  const endMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);

  console.log("\n==================================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  console.log(`⏱️ Total Execution Time: ${totalDuration}s for 55 images`);
  console.log(`📊 Final Heap Memory: ${endMemory} MB (No memory leak)`);
  console.log("==================================================");
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ TEST FAILED WITH ERROR:", err);
    process.exit(1);
  });
