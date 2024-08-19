const cheerio = require('cheerio');
// const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const fs = require('fs');

const mongoUri = "mongodb://localhost:27017";
const dbName = 'test';
const collectionName = 'scholarships_test2';

// Function to read the JSON file and get the university info
const getUniversityInfo = () => {
    try {
        const data = JSON.parse(fs.readFileSync('universities.json', 'utf8'));
        return data;
    } catch (error) {
        console.error("Error reading the JSON file:", error.message);
        return [];
    }
};

const scrapScholarships = async (universityName, url) => {
    try {
        console.log(`Fetching data for ${universityName} from ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const scholarships = [];
        const courseName = $('h1.jsx-1056176865.text-white.font-weight-bold.mt-0.mb-1.text-lg').text().trim();
        console.log(`Course Name: ${courseName}`);
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
        console.error("Error scraping scholarships:", error.message);
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
        console.error("Error connecting to MongoDB or inserting document:", error.message);
    } finally {
        await client.close();
    }
};

// Read university info and run the scraping task for each entry
const universityInfoList = getUniversityInfo();
universityInfoList.forEach(async (universityInfo) => {
    if (universityInfo) {
        await scrapScholarships(universityInfo.universityName, universityInfo.url);
    }
});
