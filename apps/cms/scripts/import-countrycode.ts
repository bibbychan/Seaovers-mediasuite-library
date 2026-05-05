/**
 * import-countrycode.ts - 將 countrycode.csv 匯入 PostgreSQL
 *
 * 用途：
 * 1. 讀取 countrycode.csv（countryName, Alpha-2-code）
 * 2. 匯入 PostgreSQL Countrycode table
 *
 * 使用：npx tsx apps/cms/scripts/import-countrycode.ts [--dry-run]
 */

import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';

const COUNTRYCODE_CSV = '/Users/bibby.chan/Developer/GitHub/Seaovers-mediasuite-library/data-source/countrycode.csv';

function normalizeColumnName(name: string): string {
  // Remove BOM (U+FEFF) and trim whitespace
  return name.replace(/^﻿/, '').trim();
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  console.log(`\n=== 匯入 Countrycode ===`);
  console.log(`模式：${isDryRun ? 'DRY-RUN（預覽）' : '實際執行'}`);
  console.log(`Database URL：postgresql://seaovers:seaovers123@localhost:5433/seaovers_media\n`);

  const prisma = new PrismaClient();

  try {
    // 1. 讀取 countrycode.csv
    const content = fs.readFileSync(COUNTRYCODE_CSV, 'utf-8');
    const records: any[] = parse(content, {
      columns: (headers) => headers.map(normalizeColumnName),
      skip_empty_lines: true,
      trim: true,
    });
    console.log(`countrycode.csv：${records.length} 筆記錄（含空行）`);

    // 2. 過濾並轉換資料
    const data = records
      .filter(r => r.countryName && r.countryName.trim() !== '')
      .map(r => ({
        countryName: r.countryName.trim(),
        alpha2code: (r['Alpha-2-code'] || '').trim().toUpperCase(),
      }));

    console.log(`準備匯入：${data.length} 筆記錄`);

    if (isDryRun) {
      console.log('\n--- DRY-RUN 預覽（前 10 筆記錄）---');
      data.slice(0, 10).forEach((r, i) => {
        console.log(`${i + 1}. ${r.countryName} → ${r.alpha2code}`);
      });
      console.log('\n若要實際執行，移除 --dry-run 參數');
      return;
    }

    // 3. 批次匯入
    await prisma.countrycode.createMany({
      data,
      skipDuplicates: true,
    });

    console.log(`\n=== 完成 ===`);
    console.log(`- Countrycode：${data.length} 筆記錄`);

  } catch (error) {
    console.error('匯入失敗：', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
