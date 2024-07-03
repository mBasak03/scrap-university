const cheerio = require('cheerio');
// const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');

const url = "https://collegedunia.com/canada/university/82-laval-university-quebec-city/programs?course_id=16614";
const universityName="Laval University, Quebec City"
const scrapScholarships = async () => {
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
        await saveToMongoDB({universityName, courseName, scholarships });

    } catch (error) {
        console.log("Error: ", error.message);
    }
};

const saveToMongoDB = async (data) => {
    const uri = "mongodb://localhost:27017";
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db('scholarshipsDB');
        const collection = database.collection('scholarships');

        const result = await collection.insertOne(data);
        console.log(`New listing created with the following id: ${result.insertedId}`);
    } catch (error) {
        console.error("Error connecting to MongoDB or inserting document:", error);
    } finally {
        await client.close();
    }
};

scrapScholarships();
