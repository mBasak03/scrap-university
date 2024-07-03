const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const url = "https://collegedunia.com/canada/university/104-university-of-toronto-toronto/programs?course_id=193940";

async function scrapScholarShips() {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        await page.goto(url, { waitUntil: 'networkidle2' });

        const loadMoreButtonSelector = 'button.show-btn'; // Updated selector for the "Show More" button

        while (true) {
            const loadMoreButton = await page.$(loadMoreButtonSelector);
            if (!loadMoreButton) break;

            const buttonText = await page.evaluate(button => button.innerText, loadMoreButton);
            console.log(`Clicking button with text: ${buttonText}`);

            if (buttonText === 'Show less') break;

            await loadMoreButton.click();
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
        }

        const html = await page.content();
        const $ = cheerio.load(html);
        const scholarships = [];

        $('table.jsx-3863647370.list-unstyled.mb-0.sa-college-table > tbody.jsx-3863647370 > tr').each((index, element) => {
            const name = $(element).find('td.col-title a').text().trim();
            // const amountInr = $(element).find('td.col-amount span.text-nowrap').first().text().trim();
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

        console.log(scholarships);

        await browser.close();

    } catch (e) {
        console.error("Error:", e.message);
    }
}

scrapScholarShips();
