const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { MongoClient } = require('mongodb');

const url = "https://collegedunia.com/canada/university/104-university-of-toronto-toronto/programs?course_id=193940";
const universityName = "University of Toronto";

async function scrapScholarShips() {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        await page.goto(url, { waitUntil: 'networkidle2' });

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
        const courseName = $('h1.jsx-1056176865.text-white.font-weight-bold.mt-0.mb-1.text-lg').text().trim();

        $('table.jsx-3863647370.list-unstyled.mb-0.sa-college-table > tbody.jsx-3863647370 > tr').each((index, element) => {
            const name = $(element).find('td.col-title a').text().trim();
            const amountUsd = $(element).find('td.col-amount span.text-nowrap').last().text().trim();
            const levelOfStudy = $(element).find('td.col-level span.text-nowrap').last().text().trim();
            const type = $(element).find('td.col-type span.text-nowrap').last().text().trim();

            const amount = `${amountUsd}`;

            scholarships.push({
                name,
                amount,
                levelOfStudy,
                type
            });
        });

        await browser.close();

        // MongoDB connection and saving
        const uri = "mongodb://localhost:27017";
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

        try {
            await client.connect();
            const database = client.db('universityDB');
            const collection = database.collection('scholarships-test');

            const document = {
                universityName: universityName,
                courseName: courseName,
                scholarships: scholarships
            };

            const result = await collection.insertOne(document);
            console.log(`New listing created with the following id: ${result.insertedId}`);
        } finally {
            await client.close();
        }

    } catch (e) {
        console.error("Error:", e.message);
    }
}

scrapScholarShips();
