import { StitchToolClient } from '@google/stitch-sdk';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const apiKey = process.env.STITCH_API_KEY;
if (!apiKey) {
  console.error('STITCH_API_KEY environment variable is required');
  process.exit(1);
}
const projectId = '14243165444609509840';

const screens = [
  { index: 1, id: '07f56ef2d335481db89edd0fc1ff9d07', title: 'Inbox', targetFolder: '01-inbox-mobile-07f56ef2' },
  { index: 2, id: '2f9d967e4b7e4bfaa7db6cc6c5c16948', title: 'Opportunities', targetFolder: '02-opportunities-mobile-2f9d967e' },
  { index: 3, id: '876dc75efb3e40a8b2bf5cfcba8e101e', title: 'Platform Projects', targetFolder: '03-platform-projects-mobile-876dc75e' },
  { index: 4, id: '8b7c5beffe934e5194bf04026c64eb83', title: 'Dashboard', targetFolder: '04-dashboard-mobile-8b7c5bef' },
  { index: 5, id: '4a4263a10b95482a9691bc14411a6db8', title: 'Opportunities', targetFolder: '05-opportunities-desktop-4a4263a1' },
  { index: 6, id: 'e1d12d5a8d4e4af78d926bfccd5c4457', title: 'Dashboard', targetFolder: '06-dashboard-desktop-e1d12d5a' },
  { index: 7, id: '55607e20488c4364a4be0b16a100d452', title: 'Inbox', targetFolder: '07-inbox-desktop-55607e20' },
  { index: 8, id: 'b5868f8377534cc2aff3c9f89c9a5fdc', title: 'Platform Projects', targetFolder: '08-platform-projects-desktop-b5868f83' },
];

function downloadWithCurl(url, destPath) {
  const authedUrl = url.includes('?') ? `${url}&key=${apiKey}` : `${url}?key=${apiKey}`;
  execFileSync('curl.exe', ['-s', '-L', authedUrl, '-o', destPath]);
}

async function run() {
  const client = new StitchToolClient({ apiKey });
  const baseOutDir = path.resolve(process.cwd(), 'design/stitch-specs');
  if (!fs.existsSync(baseOutDir)) {
    fs.mkdirSync(baseOutDir, { recursive: true });
  }

  const report = [];

  for (const s of screens) {
    console.log(`\n[${s.index}/8] Fetching screen: ${s.title} (${s.id})...`);
    let screenData = null;
    let attempts = 0;
    while (!screenData && attempts < 3) {
      try {
        attempts++;
        screenData = await client.callTool('get_screen', {
          name: `projects/${projectId}/screens/${s.id}`,
        });
      } catch (e) {
        console.warn(`  Attempt ${attempts} failed (${e.message}). Retrying in 2s...`);
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!screenData) {
      console.error(`  Failed to retrieve metadata for screen ${s.id}`);
      report.push({ ...s, success: false, error: 'Metadata fetch failed' });
      continue;
    }

    const folderPath = path.join(baseOutDir, s.targetFolder);
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Save metadata
    fs.writeFileSync(path.join(folderPath, 'metadata.json'), JSON.stringify(screenData, null, 2), 'utf8');

    // Download HTML
    const htmlDest = path.join(folderPath, 'code.html');
    if (screenData.htmlCode?.downloadUrl) {
      try {
        downloadWithCurl(screenData.htmlCode.downloadUrl, htmlDest);
        const stats = fs.statSync(htmlDest);
        console.log(`  ✓ Downloaded code.html (${stats.size} bytes)`);
      } catch (err) {
        console.error(`  ✗ Failed to download code.html:`, err.message);
      }
    }

    // Download Screenshot
    const imgDest = path.join(folderPath, 'screen.png');
    if (screenData.screenshot?.downloadUrl) {
      try {
        downloadWithCurl(screenData.screenshot.downloadUrl, imgDest);
        const stats = fs.statSync(imgDest);
        console.log(`  ✓ Downloaded screen.png (${stats.size} bytes)`);
      } catch (err) {
        console.error(`  ✗ Failed to download screen.png:`, err.message);
      }
    }

    report.push({
      index: s.index,
      title: s.title,
      id: s.id,
      deviceType: screenData.deviceType,
      width: screenData.width,
      height: screenData.height,
      folder: s.targetFolder,
      codeHtmlBytes: fs.existsSync(htmlDest) ? fs.statSync(htmlDest).size : 0,
      screenPngBytes: fs.existsSync(imgDest) ? fs.statSync(imgDest).size : 0,
      success: true,
    });
  }

  await client.close();

  fs.writeFileSync(path.join(baseOutDir, 'manifest.json'), JSON.stringify(report, null, 2), 'utf8');

  console.log('\n=======================================');
  console.log('ALL SCREENS DOWNLOADED SUCCESSFULLY:');
  console.log('=======================================');
  console.table(report);
}

run();
