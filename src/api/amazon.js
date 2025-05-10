const AMAZON_ACCESS_KEY = process.env.REACT_APP_AMAZON_ACCESS_KEY;
const AMAZON_SECRET_KEY = process.env.REACT_APP_AMAZON_SECRET_KEY;
const AMAZON_PARTNER_TAG = process.env.REACT_APP_AMAZON_PARTNER_TAG;
const AMAZON_HOST = 'webservices.amazon.com';
const AMAZON_REGION = 'us-east-1';

const generateSignature = async (method, path, queryParams, payload) => {
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  const canonicalRequest = [
    method,
    path,
    queryParams,
    `host:${AMAZON_HOST}`,
    `x-amz-date:${date}T000000Z`,
    '',
    'host;x-amz-date',
    await sha256(payload || '')
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    `${date}T000000Z`,
    `${date}/${AMAZON_REGION}/ProductAdvertisingAPI/aws4_request`,
    await sha256(canonicalRequest)
  ].join('\n');

  const signingKey = await getSigningKey(date);
  return hmacSha256(signingKey, stringToSign);
};

const sha256 = async (message) => {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

const getSigningKey = async (date) => {
  const kDate = await hmacSha256(`AWS4${AMAZON_SECRET_KEY}`, date);
  const kRegion = await hmacSha256(kDate, AMAZON_REGION);
  const kService = await hmacSha256(kRegion, 'ProductAdvertisingAPI');
  return hmacSha256(kService, 'aws4_request');
};

const hmacSha256 = async (key, message) => {
  const keyBuffer = new TextEncoder().encode(key);
  const messageBuffer = new TextEncoder().encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    cryptoKey,
    messageBuffer
  );
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const searchAmazonProducts = async (query, category = 'All') => {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    const payload = JSON.stringify({
      Keywords: query,
      SearchIndex: category === 'All' ? 'All' : category,
      Resources: [
        'ItemInfo.Title',
        'ItemInfo.Features',
        'ItemInfo.ProductInfo',
        'ItemInfo.ByLineInfo',
        'ItemInfo.ExternalIds',
        'ItemInfo.ContentInfo',
        'ItemInfo.ManufactureInfo',
        'ItemInfo.ProductInfo',
        'ItemInfo.TechnicalInfo',
        'ItemInfo.Classifications',
        'Offers.Listings.Price',
        'Images.Primary.Large',
        'Images.Variants.Large'
      ]
    });

    const queryParams = new URLSearchParams({
      'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
      'X-Amz-Date': `${date}T000000Z`,
      'X-Amz-SignedHeaders': 'host;x-amz-date',
      'X-Amz-Expires': '300',
      'X-Amz-Credential': `${AMAZON_ACCESS_KEY}/${date}/${AMAZON_REGION}/ProductAdvertisingAPI/aws4_request`,
      'PartnerTag': AMAZON_PARTNER_TAG,
      'PartnerType': 'Associates',
      'Marketplace': 'www.amazon.com'
    });

    const signature = await generateSignature('POST', '/paapi5/searchitems', '', payload);
    queryParams.append('X-Amz-Signature', signature);

    const response = await fetch(`https://${AMAZON_HOST}/paapi5/searchitems?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Host': AMAZON_HOST,
        'X-Amz-Date': `${date}T000000Z`
      },
      body: payload
    });

    const data = await response.json();
    
    if (data.SearchResult && data.SearchResult.Items) {
      return data.SearchResult.Items.map(item => ({
        id: item.ASIN,
        name: item.ItemInfo.Title.DisplayValue,
        price: item.Offers?.Listings?.[0]?.Price?.Amount || 0,
        description: item.ItemInfo.Features?.DisplayValues?.join(' ') || '',
        image: item.Images?.Primary?.Large?.URL || '',
        category: category,
        link: `https://www.amazon.com/dp/${item.ASIN}?tag=${AMAZON_PARTNER_TAG}`,
        brand: item.ItemInfo.ByLineInfo?.Brand?.DisplayValue || '',
        rating: item.CustomerReviews?.StarRating?.DisplayValue || '',
        reviewCount: item.CustomerReviews?.Count || 0
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching Amazon products:', error);
    return [];
  }
}; 