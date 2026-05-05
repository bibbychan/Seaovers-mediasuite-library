/**
 * import-library.ts - 階段二：將 CSV 匯入 PostgreSQL
 *
 * 用途：
 * 1. 讀取更新後的 library.csv（含 UID）和 vodsources.csv（含 library_uid）
 * 2. Zod 驗證資料
 * 3. 每 400 筆記錄批量插入 PostgreSQL
 *
 * 使用：npx tsx apps/cms/scripts/import-library.ts [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const LIBRARY_CSV = '/Users/bibby.chan/Developer/GitHub/Seaovers-mediasuite-library/data-source/library.csv';
const VODSOURCES_CSV = '/Users/bibby.chan/Developer/GitHub/Seaovers-mediasuite-library/data-source/vodsources.csv';
const BATCH_SIZE = 400;

interface LibraryRow {
  MS_PROVIDER_NAME: string;
  MS_PROVIDER_ID: string;
  VOD_TASK_ID: string;
  HOUSE_ID: string;
  FILENAME: string;
  ORG_TITLE: string;
  TITLE_ENGLISH: string;
  TITLE_CHINESE: string;
  SEASON: string;
  EPISODE: string;
  GENRE: string;
  'PROD. YEAR': string;
  DIRECTOR: string;
  CAST: string;
  COUNTRY: string;
  'ORIGINAL LANGUAGE': string;
  'IMDB LINK': string;
  VENDOR: string;
  SVOD: string;
  AVOD: string;
  FAST: string;
  'PAY TV': string;
  VIDEO_ORIENTATION: string;
  VIDEO_RATIO: string;
  IS_BURN_IN: string;
  SRT: string;
  THRUMBNAIL_LAND: string;
  THRUMBNAIL_PORT: string;
  THRUMBNAIL_URL: string;
  POSTER_PORTRAIT: string;
  POSTER_URL: string;
  'DURATION(s)': string;
  ONSHELF_DATE: string;
  OFFSHELF_DATE: string;
  STATUS: string;
  UPDATE_DATE: string;
  CREATE_DATE: string;
  UID: string;
}

interface VodsourcesRow {
  id: string;
  name: string;
  vod_task_id: string;
  url: string;
  duration: string;
  broadpeak_asset_id: string;
  created_at: string;
  updated_at: string;
  provider_id: string;
  status: string;
  on_shelf_date: string;
  off_shelf_date: string;
  que_points: string;
  metadata: string;
  init_metadata: string;
  region: string;
  orientation: string;
  ai_cue_point: string;
  library_uid: string;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.trim().split(' ');
  const datePart = parts[0];
  const timePart = parts[1];

  const [month, day, year] = datePart.split('/').map(Number);
  if (isNaN(month) || isNaN(day) || isNaN(year)) return null;

  const fullYear = year < 100 ? 2000 + year : year;
  const hour = timePart ? timePart.split(':').map(Number)[0] : 9;
  const minute = timePart ? timePart.split(':').slice(1).map(Number)[0] : 0;

  return new Date(fullYear, month - 1, day, hour, minute);
}

function parseIntSafe(val: string): number | null {
  if (!val || val.trim() === '') return null;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? null : parsed;
}

function normalizeColumnName(name: string): string {
  // Remove BOM (U+FEFF) and trim whitespace
  return name.replace(/^﻿/, '').trim();
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log(`\n=== 階段二：匯入 PostgreSQL ===`);
  console.log(`模式：${isDryRun ? 'DRY-RUN（預覽）' : '實際執行'}`);
  console.log(`Database URL：postgresql://seaovers:seaovers123@localhost:5433/seaovers_media\n`);

  const prisma = new PrismaClient();

  try {
    // 1. 讀取 library.csv
    const libraryContent = fs.readFileSync(LIBRARY_CSV, 'utf-8');
    const libraryRecords: LibraryRow[] = parse(libraryContent, {
      columns: (headers) => headers.map(normalizeColumnName),
      skip_empty_lines: true,
      trim: true,
    });
    console.log(`library.csv：${libraryRecords.length} 筆記錄`);

    // 2. 讀取 vodsources.csv
    const vodContent = fs.readFileSync(VODSOURCES_CSV, 'utf-8');
    const vodRecords: VodsourcesRow[] = parse(vodContent, {
      columns: (headers) => headers.map(normalizeColumnName),
      skip_empty_lines: true,
      trim: true,
    });
    console.log(`vodsources.csv：${vodRecords.length} 筆記錄`);

    // 3. 建立 vod_task_id → libraryUid 映射
    const vodTaskIdToLibraryUid = new Map<string, string>();
    for (const record of vodRecords) {
      if (record.vod_task_id && record.library_uid) {
        vodTaskIdToLibraryUid.set(record.vod_task_id, record.library_uid);
      }
    }

    // 4. 準備 Library 資料（去重）
    const seenUids = new Set<string>();
    const libraryData = libraryRecords
      .filter(r => r.UID && r.UID.trim() !== '')
      .filter(r => {
        if (seenUids.has(r.UID)) return false;
        seenUids.add(r.UID);
        return true;
      })
      .map(r => ({
        uid: r.UID,
        vodTaskId: r.VOD_TASK_ID || '',
        houseId: r.HOUSE_ID || null,
        providerName: r.MS_PROVIDER_NAME || null,
        providerId: parseIntSafe(r.MS_PROVIDER_ID),
        filename: r.FILENAME || null,
        orgTitle: r.ORG_TITLE || null,
        titleEnglish: r.TITLE_ENGLISH || null,
        titleChinese: r.TITLE_CHINESE || null,
        season: r.SEASON || null,
        episode: r.EPISODE || null,
        genre: r.GENRE || null,
        prodYear: parseIntSafe(r['PROD. YEAR']),
        director: r.DIRECTOR || null,
        cast: r.CAST || null,
        country: r.COUNTRY || null,
        originalLanguage: r['ORIGINAL LANGUAGE'] || null,
        imdbLink: r['IMDB LINK'] || null,
        vendor: r.VENDOR || null,
        svod: r.SVOD || null,
        avod: r.AVOD || null,
        fast: r.FAST || null,
        payTv: r['PAY TV'] || null,
        videoOrientation: parseIntSafe(r.VIDEO_ORIENTATION),
        videoRatio: r.VIDEO_RATIO || null,
        isBurnIn: r.IS_BURN_IN === '1',
        srt: r.SRT || null,
        thumbnailLand: r.THRUMBNAIL_LAND || null,
        thumbnailPort: r.THRUMBNAIL_PORT || null,
        thumbnailUrl: r.THRUMBNAIL_URL || null,
        posterPortrait: r.POSTER_PORTRAIT || null,
        posterUrl: r.POSTER_URL || null,
        duration: parseIntSafe(r['DURATION(s)']),
        onshelfDate: parseDate(r.ONSHELF_DATE),
        offshelfDate: parseDate(r.OFFSHELF_DATE),
        status: parseIntSafe(r.STATUS) || 1,
        updateDate: parseDate(r.UPDATE_DATE),
        createDate: parseDate(r.CREATE_DATE),
      }));

    console.log(`準備匯入 Library：${libraryData.length} 筆記錄`);

    if (isDryRun) {
      console.log('\n--- DRY-RUN 預覽（前 3 筆記錄）---');
      libraryData.slice(0, 3).forEach((r, i) => {
        console.log(`${i + 1}. uid: ${r.uid}, titleEnglish: ${r.titleEnglish}, country: ${r.country}`);
      });
      console.log('\n若要實際執行，移除 --dry-run 參數');
      return;
    }

    // 5. 準備 Vodsources 資料（過濾並去重）
    const seenVodIds = new Set<string>();
    const vodsourcesData = vodRecords
      .filter(r => r.id && r.id !== 'id' && r.library_uid && r.library_uid.trim() !== '')
      .filter(r => {
        if (seenVodIds.has(r.id)) return false;
        seenVodIds.add(r.id);
        return true;
      })
      .map(r => ({
        id: r.id,
        name: r.name,
        libraryUid: r.library_uid,
        url: r.url || '',
        duration: parseIntSafe(r.duration),
        broadpeakAssetId: r.broadpeak_asset_id || null,
        providerId: parseIntSafe(r.provider_id),
        status: parseIntSafe(r.status) || 1,
        onshelfDate: parseDate(r.on_shelf_date),
        offshelfDate: parseDate(r.off_shelf_date),
        quePoints: r.que_points || null,
        metadata: r.metadata || null,
        initMetadata: r.init_metadata || null,
        region: r.region || null,
        orientation: parseIntSafe(r.orientation),
        aiCuePoint: r.ai_cue_point || null,
      }));

    console.log(`準備匯入 Vodsources：${vodsourcesData.length} 筆記錄`);

    // 6. 批量匯入 Library
    console.log(`\n匯入 Library（每批 ${BATCH_SIZE} 筆記錄）...`);
    let libraryInserted = 0;

    for (let i = 0; i < libraryData.length; i += BATCH_SIZE) {
      const batch = libraryData.slice(i, i + BATCH_SIZE);
      await prisma.library.createMany({
        data: batch,
        skipDuplicates: true,
      });
      libraryInserted += batch.length;
      console.log(`  已匯入 ${libraryInserted}/${libraryData.length}`);
    }

    // 7. 批量匯入 Vodsources（逐筆插入以處理邊界問題）
    console.log(`\n匯入 Vodsources（逐筆插入）...`);
    let vodInserted = 0;
    let vodSkipped = 0;

    for (const record of vodsourcesData) {
      try {
        await prisma.vodsources.create({
          data: record,
        });
        vodInserted++;
      } catch (e) {
        if (e.code === 'P2002') {
          // Duplicate - skip
          vodSkipped++;
        } else if (e.code === 'P2003') {
          // FK constraint - skip (orphan record)
          vodSkipped++;
        } else {
          throw e;
        }
      }
      if ((vodInserted + vodSkipped) % 500 === 0) {
        console.log(`  已處理 ${vodInserted + vodSkipped}/${vodsourcesData.length}`);
      }
    }

    console.log(`  實際匯入：${vodInserted}，跳過：${vodSkipped}`);

    console.log(`\n=== 完成 ===`);
    console.log(`- Library：${libraryInserted} 筆記錄`);
    console.log(`- Vodsources：${vodInserted} 筆記錄`);

  } catch (error) {
    console.error('匯入失敗：', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
