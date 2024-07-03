// const fetch = require('node-fetch');
const cheerio = require('cheerio');

const url = "https://collegedunia.com/canada/university/104-university-of-toronto-toronto";

async function scrapeProgramInfo() {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    // Adjust the selector as needed
    const countCourses= $('tbody.jsx-2776855364 > tr')
    for(let i= 0; i< countCourses.length; i++){
      const el= countCourses[i];
      const courseName= $(el).find('td[class="jsx-2776855364 col-program"] > div > span > a').text()
      const importantDates= $(el).find('td[class="jsx-2776855364 col-application-deadline"] > div > div > span[class="jsx-2776855364 text-capitalize"]').text()
      console.log(courseName)
      console.log(importantDates)
    }

  } catch (error) {
    console.error("Error scraping program information:", error);
  }
}

scrapeProgramInfo();
