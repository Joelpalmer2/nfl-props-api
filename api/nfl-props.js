import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Starting NFL props scrape...');
    
    const response = await axios.get('https://www.fantasysp.com/nfl/prop-bets', {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    console.log('Got response, parsing HTML...');
    const $ = cheerio.load(response.data);
    const props = [];

    // Try multiple selectors in case the structure varies
    let elementsFound = 0;
    
    $('.player-prop-wrapper').each((index, element) => {
      elementsFound++;
      const nameEl = $(element).find('a');
      const statEl = $(element).find('.prop-stat-name');
      const lineEl = $(element).find('.prop-stat-name + td');
      
      const name = nameEl.text().trim();
      const stat = statEl.text().trim();
      const line = lineEl.text().trim();

      console.log(`Element ${index}: name="${name}", stat="${stat}", line="${line}"`);

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

    console.log(`Found ${elementsFound} wrapper elements, extracted ${props.length} valid props`);

    // If no props found, return debug info
    if (props.length === 0) {
      return res.status(200).json({
        success: false,
        debug: {
          message: 'No props extracted',
          elementsFound: elementsFound,
          htmlLength: response.data.length,
          sampleHtml: response.data.substring(0, 500)
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        props: props,
        total: props.length,
        scraped_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error details:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch NFL props data',
        details: error.message,
        stack: error.stack
      }
    });
  }
}
