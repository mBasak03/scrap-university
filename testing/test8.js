const cheerio = require('cheerio');
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const cron = require('node-cron');
const fs = require('fs');

const mongoUri = "mongodb://localhost:27017";
const dbName = 'test';
const collectionName = 'scholarships_test';

let currentIndex = 0;

// Function to read the JSON file and get the current university info
const getUniversityInfo = () => {
    const data = JSON.parse(fs.readFileSync('universities.json', 'utf8'));
    const universityInfo = data[currentIndex];
    currentIndex = (currentIndex + 1) % data.length;
    return universityInfo;
};

const scrapScholarships = async (universityName, url) => {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });
        const html = await response.text();
        const $ = cheerio.load(html);

        // Select all rows in the tbody
        const scholarships = [];
        const courseName = $('h1.jsx-1056176865.text-white.font-weight-bold.mt-0.mb-1.text-lg').text().trim();
        console.log(courseName);
        $('tbody.jsx-3863647370 tr.jsx-3863647370').each((index, element) => {
            const title = $(element).find('.scholarship-title').text().trim();
            let amount = $(element).find('.col-amount .other-data-value').text().trim();
            const level = $(element).find('.col-level .other-data-value').text().trim();
            const type = $(element).find('.col-type .other-data-value').text().trim();

            let amountObject;
            if (amount !== 'Variable Amount') {
                const [INR, CAD] = amount.split('$');
                amountObject = {
                    INR: INR.trim(),
                    CAD: '$' + CAD.trim()
                };
            } else {
                amountObject = 'Variable Amount';
            }

            scholarships.push({
                title,
                amount: amountObject,
                level,
                type,
            });
        });

        console.log({
            universityName: universityName,
            courseName: courseName,
            scholarships: scholarships
        });

        // Save to MongoDB
        await saveToMongoDB({ universityName, courseName, scholarships });

    } catch (error) {
        console.log("Error: ", error.message);
    }
};

const saveToMongoDB = async (data) => {
    const client = new MongoClient(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db(dbName);
        const collection = database.collection(collectionName);

        const result = await collection.insertOne(data);
        console.log(`New listing created with the following id: ${result.insertedId}`);
    } catch (error) {
        console.error("Error connecting to MongoDB or inserting document:", error);
    } finally {
        await client.close();
    }
};

// Schedule the scraping task to run every 10 minutes
cron.schedule('*/10 * * * *', () => {
    console.log('Running the scraping task...');
    const { universityName, url } = getUniversityInfo();
    scrapScholarships(universityName, url);
});
