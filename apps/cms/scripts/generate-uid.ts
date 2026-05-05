/**
 * generate-uid.ts - 階段一：為 library.csv 生成 UID
 *
 * 用途：
 * 1. 讀取 library.csv，為缺少 UID 的記錄生成 SO-A-XXXXXXXX
 * 2. 建立 vod_task_id → UID 映射
 * 3. 更新 vodsources.csv 寫入 library_uid
 *
 * 使用：npx tsx apps/cms/scripts/generate-uid.ts [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

const LIBRARY_CSV = '/Users/bibby.chan/Developer/GitHub/Seaovers-mediasuite-library/data-source/library.csv';
const VODSOURCES_CSV = '/Users/bibby.chan/Developer/GitHub/Seaovers-mediasuite-library/data-source/vodsources.csv';

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
  UID?: string; // 若 CSV 有 UID 欄位
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
  library_uid?: string;
}

function generateUid(counter: number): string {
  return `SO-A-${String(counter).padStart(8, '0')}`;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr.trim() === '') return null;
  // 格式：M/D/YY H:mm 或 M/D/YY
  const parts = dateStr.trim().split(' ');
  const datePart = parts[0];
  const timePart = parts[1];

  const [month, day, year] = datePart.split('/').map(Number);
  if (isNaN(month) || isNaN(day) || isNaN(year)) return null;

  // 處理 2 位數年份
  const fullYear = year < 100 ? 2000 + year : year;
  const hour = timePart ? timePart.split(':').map(Number)[0] : 9;
  const minute = timePart ? timePart.split(':').slice(1).map(Number)[0] : 0;

  return new Date(fullYear, month - 1, day, hour, minute);
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log(`\n=== 階段一：生成 UID ===`);
  console.log(`模式：${isDryRun ? 'DRY-RUN（預覽）' : '實際執行'}\n`);

  // 1. 讀取 library.csv
  const libraryContent = fs.readFileSync(LIBRARY_CSV, 'utf-8');
  const libraryRecords: LibraryRow[] = parse(libraryContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`library.csv：${libraryRecords.length} 筆記錄`);

  // 2. 建立 vod_task_id → UID 映射
  const vodTaskIdToUid = new Map<string, string>();

  // 找出現有最大 UID 號碼
  let maxUidNumber = 0;
  const uidRegex = /^SO-A-(\d+)$/;

  for (const record of libraryRecords) {
    if (record.UID && uidRegex.test(record.UID)) {
      const num = parseInt(record.UID.match(uidRegex)![1], 10);
      if (num > maxUidNumber) maxUidNumber = num;
    }
  }

  console.log(`現有最大 UID：SO-A-${String(maxUidNumber).padStart(8, '0')}`);

  // 3. 為缺少 UID 的記錄生成 UID
  let newUidCounter = maxUidNumber + 1;
  let newCount = 0;

  for (const record of libraryRecords) {
    if (!record.UID || record.UID.trim() === '') {
      const uid = generateUid(newUidCounter++);
      record.UID = uid;
      newCount++;
    }
    // 建立映射（用 VOD_TASK_ID 關聯）
    if (record.VOD_TASK_ID) {
      vodTaskIdToUid.set(record.VOD_TASK_ID, record.UID!);
    }
  }

  console.log(`生成新 UID：${newCount} 筆記錄`);
  console.log(`vod_task_id → UID 映射：${vodTaskIdToUid.size} 筆記錄\n`);

  if (isDryRun) {
    console.log('--- DRY-RUN 預覽（前 5 筆記錄）---');
    libraryRecords.slice(0, 5).forEach((r, i) => {
      console.log(`${i + 1}. UID: ${r.UID}, VOD_TASK_ID: ${r.VOD_TASK_ID}, TITLE: ${r.TITLE_ENGLISH}`);
    });
    console.log('\n若要實際執行，移除 --dry-run 參數');
    return;
  }

  // 4. 更新 library.csv（寫入 UID 欄位）
  const libraryDir = path.dirname(LIBRARY_CSV);
  const libraryBasename = path.basename(LIBRARY_CSV, '.csv');
  const libraryBackupPath = path.join(libraryDir, `${libraryBasename}_backup.csv`);
  const libraryOutputPath = LIBRARY_CSV;

  // 備份原檔案
  fs.copyFileSync(LIBRARY_CSV, libraryBackupPath);
  console.log(`備份：${libraryBackupPath}`);

  // 重建 CSV（加上 UID 欄位在最後）
  const headers = Object.keys(libraryRecords[0]);
  if (!headers.includes('UID')) {
    headers.push('UID');
  }

  const csvLines: string[] = [headers.join(',')];

  for (const record of libraryRecords) {
    const values = headers.map(h => {
      const val = (record as Record<string, string>)[h];
      // 處理包含逗號或引號的值
      if (val && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val || '';
    });
    csvLines.push(values.join(','));
  }

  fs.writeFileSync(libraryOutputPath, csvLines.join('\n'), 'utf-8');
  console.log(`更新：${libraryOutputPath}`);

  // 5. 更新 vodsources.csv（寫入 library_uid 欄位）
  const vodContent = fs.readFileSync(VODSOURCES_CSV, 'utf-8');
  const vodRecords: VodsourcesRow[] = parse(vodContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`\nvodsources.csv：${vodRecords.length} 筆記錄`);

  // 更新 library_uid
  let vodUpdatedCount = 0;
  for (const record of vodRecords) {
    const uid = vodTaskIdToUid.get(record.vod_task_id);
    if (uid) {
      record.library_uid = uid;
      vodUpdatedCount++;
    }
  }

  // 備份並更新
  const vodDir = path.dirname(VODSOURCES_CSV);
  const vodBasename = path.basename(VODSOURCES_CSV, '.csv');
  const vodBackupPath = path.join(vodDir, `${vodBasename}_backup.csv`);
  const vodOutputPath = VODSOURCES_CSV;

  fs.copyFileSync(VODSOURCES_CSV, vodBackupPath);
  console.log(`備份：${vodBackupPath}`);

  // 重建 CSV
  const vodHeaders = Object.keys(vodRecords[0]);
  if (!vodHeaders.includes('library_uid')) {
    vodHeaders.push('library_uid');
  }

  const vodCsvLines: string[] = [vodHeaders.join(',')];

  for (const record of vodRecords) {
    const values = vodHeaders.map(h => {
      const val = (record as Record<string, string>)[h];
      if (val && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val || '';
    });
    vodCsvLines.push(values.join(','));
  }

  fs.writeFileSync(vodOutputPath, vodCsvLines.join('\n'), 'utf-8');
  console.log(`更新：${vodOutputPath}`);

  console.log(`\n=== 完成 ===`);
  console.log(`- 新增 UID：${newCount} 筆記錄`);
  console.log(`- 更新 vodsources.library_uid：${vodUpdatedCount} 筆記錄`);
  console.log(`- 下階段：執行 import-library.ts 匯入資料庫`);
}

main().catch(console.error);
