const axios = require('axios');
const cheerio = require('cheerio');

const url = "https://collegedunia.com/canada/university/104-university-of-toronto-toronto/programs?stream_id=43";

const extractData = (html) => {
  const $ = cheerio.load(html);

  const courseDetails = []; 
  
  $('div.jsx-2492516079.jsx-2133140133.card-head').each((index, element) => {
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

    courseDetails.push({
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
      }
    });
  });

  return courseDetails;
};

async function scrapeProgramInfo() {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    const html = response.data;
    const courseDetails = extractData(html);
    console.log(courseDetails);
  } catch (error) {
    console.error("Error scraping program information:", error);
  }
}

scrapeProgramInfo();
