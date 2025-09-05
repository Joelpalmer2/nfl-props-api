const cheerio = require('cheerio');
const axios = require('axios');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Fetching NFL props from fantasysp.com...');
    
    const response = await axios.get('https://www.fantasysp.com/nfl/prop-bets', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    const $ = cheerio.load(response.data);
    const props = [];

    // Extract data using the same selectors as your R code
    $('.player-prop-wrapper').each((index, element) => {
      const name = $(element).find('a').text().trim();
      const stat = $(element).find('.prop-stat-name').text().trim();
      const line = $(element).find('.prop-stat-name + td').text().trim();

      if (name && stat && line) {
        props.push({
          name: name,
          stat: stat,
          line: line,
          id: `prop_${index + 1}`,
          updated_at: new Date().toISOString()
        });
      }
    });

    console.log(`Successfully scraped ${props.length} props`);

    return res.status(200).json({
      success: true,
      data: {
        props: props,
        total: props.length,
        scraped_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error scraping data:', error.message);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch NFL props data',
        details: error.message
      }
    });
  }
}
