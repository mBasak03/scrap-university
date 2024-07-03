const cheerio = require('cheerio');
const { MongoClient } = require('mongodb');
const puppeteer = require('puppeteer');

const url = "https://collegedunia.com/canada/university/104-university-of-toronto-toronto/programs?stream_id=43";
const university_name = "University of Toronto";
const scholarshipUrl = "https://collegedunia.com/canada/university/97-university-of-regina-regina/programs?course_id=25786";
const mongoUri = 'mongodb://localhost:27017';
const dbName = 'universityDB';
const collectionName = 'test';

const extractData = (html) => {
  const $ = cheerio.load(html);
  const courses = [];

  $('div[class="jsx-1810388398 jsx-3247734209 jsx-3119614149"] > div').each((index, element) => {
    const courseTitle = $(element).find('h2.card-heading a').text().trim();
    const duration = $(element).find('.course-tags .text-success').text().trim();
    const modeOfStudy = $(element).find('.course-tags .red-feature').text().trim();
    const language = $(element).find('.course-tags .silver-feature').text().trim();
    const studyType = $(element).find('.course-tags .blue-light-feature').text().trim();

    const examScores = [];
    $(element).find('.card-info span').each((index, el) => {
      const examName = $(el).find('.exam-name a').text().trim();
      const examScore = $(el).find('.exam-score').text().trim();
      if (examName && examScore) {
        examScores.push({ examName, examScore });
      }
    });

    const importantDate = $(element).find('.card-info span.text-title').text().trim();
    const feesINR = $(element).find('.fees-container .fees').first().text().trim();
    const feesCAD = $(element).find('.fees-container .text-gray').text().trim();

    courses.push({
      courseTitle,
      duration,
      modeOfStudy,
      language,
      studyType,
      examScores,
      importantDate,
      fees: {
        INR: feesINR,
        CAD: feesCAD
      },
      scholarships: [] // Placeholder for scholarships
    });
  });

  return {
    university_name: university_name,
    courses
  };
};

const scrapeScholarships = async (scholarshipUrl) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  await page.goto(scholarshipUrl, { waitUntil: 'networkidle2' });

  const loadMoreButtonSelector = 'button.show-btn';

  while (true) {
    const loadMoreButton = await page.$(loadMoreButtonSelector);
    if (!loadMoreButton) break;

    const buttonText = await page.evaluate(button => button.innerText, loadMoreButton);
    if (buttonText === 'Show less') break;

    await loadMoreButton.click();
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const html = await page.content();
  const $ = cheerio.load(html);
  const scholarships = [];
  const scholarshipName = $('h1.jsx-1056176865.text-white.font-weight-bold.mt-0.mb-1.text-lg').text().trim();

  $('table.jsx-3863647370.list-unstyled.mb-0.sa-college-table > tbody.jsx-3863647370 > tr').each((index, element) => {
    const name = $(element).find('td.col-title a').text().trim();
    const amountUsd = $(element).find('td.col-amount span.text-nowrap').last().text().trim();
    const levelOfStudy = $(element).find('td.col-level span.text-nowrap').last().text().trim();
    const type = $(element).find('td.col-type span.text-nowrap').last().text().trim();

    scholarships.push({
      name,
      amount: amountUsd,
      levelOfStudy,
      type
    });
  });

  await browser.close();

  return {
    scholarshipName: scholarshipName,
    scholarships: scholarships
  };
};

async function scrapeProgramInfo() {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    const html = await response.text();
    const data = extractData(html);
    const scholarshipsData = await scrapeScholarships(scholarshipUrl);

    // Assuming you want to add the same scholarships to each course
    data.courses.forEach(course => {
      course.scholarships = scholarshipsData.scholarships;
    });

    const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection(collectionName);

      const result = await collection.insertOne(data);
      console.log('Data inserted successfully:', result.insertedId);
    } finally {
      await client.close();
    }

  } catch (error) {
    console.error("Error scraping program information:", error);
  }
}

scrapeProgramInfo();
