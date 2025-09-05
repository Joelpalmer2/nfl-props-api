export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For now, let's try a different approach - using a proxy service
    const response = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.fantasysp.com/nfl/prop-bets'), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const data = await response.json();
    
    if (!data.contents) {
      throw new Error('No content received from proxy');
    }

    // Import cheerio dynamically
    const { load } = await import('cheerio');
    const $ = load(data.contents);
    
    const props = [];
    
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

    return res.status(200).json({
      success: true,
      data: {
        props: props,
        total: props.length,
        scraped_at: new Date().toISOString()
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch NFL props data',
        details: error.message
      }
    });
  }
}
