const fs = require('fs');
const path = require('path');
const https = require('https');

const images = [
  {
    url: 'https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=800&q=80',
    dest: path.join(__dirname, '../public/images/jobs/mn-country-mongolia.jpg'),
  },
  {
    url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    dest: path.join(__dirname, '../public/images/jobs/mn-factory-worker.jpg'),
  },
  {
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    dest: path.join(__dirname, '../public/images/jobs/mn-construction-mason.jpg'),
  },
  {
    url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
    dest: path.join(__dirname, '../public/images/jobs/mn-construction-welder.jpg'),
  },
  {
    url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=800&q=80',
    dest: path.join(__dirname, '../public/images/jobs/mn-construction-plumber.jpg'),
  },
  {
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
    dest: path.join(__dirname, '../public/images/jobs/mn-construction-electrician.jpg'),
  },
  {
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?auto=format&fit=crop&w=800&q=80',
    dest: path.join(__dirname, '../public/images/jobs/mn-construction-technical.jpg'),
  },
];

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      // Handle redirects if any
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        https.get(response.headers.location, (res2) => {
          res2.pipe(file);
          file.on('finish', () => {
            file.close(resolve);
          });
        }).on('error', (err) => {
          fs.unlink(dest, () => {});
          reject(err);
        });
        return;
      }

      if (response.statusCode !== 200) {
        fs.unlink(dest, () => {});
        reject(new Error(`Failed to download ${url}: Status code ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log('Downloading Mongolia trade & country images...');
  for (const img of images) {
    try {
      console.log(`Downloading ${path.basename(img.dest)}...`);
      await downloadFile(img.url, img.dest);
      const stat = fs.statSync(img.dest);
      console.log(`Saved ${path.basename(img.dest)} (${stat.size} bytes)`);
    } catch (e) {
      console.error(`Error downloading ${img.url}:`, e.message);
    }
  }
  console.log('Download complete.');
}

main();
