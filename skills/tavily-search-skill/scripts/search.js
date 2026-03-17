const TAVILY_API_KEY = process.env.TAVILY_API_KEY
const query = process.env.query
const TAVILY_SEARCH_URL = 'https://api.tavily.com/search'

async function searchWithTavily(query) {
  try {
    const response = await fetch(TAVILY_SEARCH_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TAVILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query,
        search_depth: 'basic', // "basic" 或 "advanced"
        max_results: 3,
      }),
    })

    const data = await response.json()

    return data?.results
  } catch (error) {
    console.error('Tavily搜索出错:', error.message)
    return null
  }
}

async function main() {
  const result = await searchWithTavily(query)
  console.log(result)
}

main()
