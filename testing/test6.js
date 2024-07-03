
const cheerio = require('cheerio');

const url = "https://collegedunia.com/canada/university/104-university-of-toronto-toronto/master-of-science-ms-applied-computing-data-science-211458";

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
        console.log(courseName)
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
            courseName: courseName,
            scholarships: scholarships
        });
    } catch (error) {
        console.log("Error: ", error.message);
    }
}

scrapScholarships();
