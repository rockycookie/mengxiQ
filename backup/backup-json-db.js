#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// JSON files to backup - read from PM2 environment (full paths)
const FILES_TO_BACKUP = process.env.BACKUP_FILES
  ? process.env.BACKUP_FILES.split(',').map(f => f.trim())
  : [];

if (FILES_TO_BACKUP.length === 0) {
  console.error('No files to backup. Set BACKUP_FILES environment variable.');
  process.exit(1);
}

// Backup directory
const BACKUP_DIR = path.join(__dirname, 'backups');
const SIZE_CACHE_FILE = path.join(BACKUP_DIR, '.size-cache.json');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log(`Created backup directory: ${BACKUP_DIR}`);
}

// Load previous file sizes
let previousSizes = {};
try {
  if (fs.existsSync(SIZE_CACHE_FILE)) {
    previousSizes = JSON.parse(fs.readFileSync(SIZE_CACHE_FILE, 'utf8'));
  }
} catch (err) {
  console.warn('Could not read size cache:', err.message);
}

// Check if any file size changed
let hasChanges = false;
let currentSizes = {};

FILES_TO_BACKUP.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      currentSizes[file] = stats.size;
      if (previousSizes[file] !== stats.size) {
        hasChanges = true;
      }
    }
  } catch (err) {
    console.error(`Error checking size for ${file}:`, err.message);
  }
});

if (!hasChanges) {
  console.log('No file size changes detected, skipping backup');
  process.exit(0);
}

// Generate backup with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupSubdir = path.join(BACKUP_DIR, `backup-${timestamp}`);

fs.mkdirSync(backupSubdir, { recursive: true });

let successCount = 0;
let errorCount = 0;

// Backup each file
FILES_TO_BACKUP.forEach(file => {
  const fileName = path.basename(file);
  const destPath = path.join(backupSubdir, fileName);

  try {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, destPath);
      console.log(`✓ Backed up: ${fileName}`);
      successCount++;
    } else {
      console.warn(`⚠ File not found: ${file}`);
    }
  } catch (err) {
    console.error(`✗ Error backing up ${fileName}:`, err.message);
    errorCount++;
  }
});

// Save current sizes
try {
  fs.writeFileSync(SIZE_CACHE_FILE, JSON.stringify(currentSizes, null, 2));
} catch (err) {
  console.error('Error saving size cache:', err.message);
}

// Cleanup old backups (keep only last 7 days)
const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
try {
  const backups = fs.readdirSync(BACKUP_DIR);
  backups.forEach(backup => {
    const backupPath = path.join(BACKUP_DIR, backup);
    const stats = fs.statSync(backupPath);
    if (stats.isDirectory() && stats.mtime.getTime() < sevenDaysAgo) {
      fs.rmSync(backupPath, { recursive: true });
      console.log(`Cleaned up old backup: ${backup}`);
    }
  });
} catch (err) {
  console.error('Error cleaning up old backups:', err.message);
}

console.log(`\nBackup completed: ${successCount} succeeded, ${errorCount} failed`);
process.exit(errorCount > 0 ? 1 : 0);
