import axios from 'axios';
import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';
interface Kv {
  key: string;
  value: string;
}

export interface Link {
  domain: string;
  id: string;
  description: string;
  relation: string;
}

export interface TableRow {
  data: Prop[];
}
export interface Table {
  name: string;
  data: TableRow[];
}

export interface Prop { 
  key: string;
  value: string[];
  links: Link[];
}
export interface Scrape {
  scrapeType: string;
  id: string;
  name: string;
  props: Prop[]; // { key: string , value: string[], links: Link[] }[];
  extraInfo: string;
  tables: Table[];
}

const cache = new NodeCache({ stdTTL: 600 }); // 10-minute TTL

export async function scrape(scrapeType: string, id: string, refresh: boolean): Scrape {
  const cacheKey = scrapeType+'/'+id;
  if (!refresh) {
    const cached = cache.get<Scrape>(cacheKey);
    if (cached) {
      console.log('✅ Returning from cache');
      return cached;
    }
  }

  const url = `https://my.strathspey.org/dd/${scrapeType.toLowerCase()}/${ id }/`;
  // console.log(`Scraping ${url}`);
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);
  // const overview = $('#overview');
  // const row = overview.find('.row');
  const tabContent = $('.tab-content');
  const row = tabContent.find('.row');
  const name = $('#title').text();
  const extraInfo = $('#extrainfo').text();

  const kv: Kv[] = [];
  const props: {key: string, value: string[], links: Link[]}[] = [];

  let myMap = new Map<string, string[]>([]);

  row.find('dt').each((_, el) => {
    const key = $(el).text();
    const value = "unset";
    kv.push({ key, value });
  });
  let i = 0;
  row.find('dd').each((_, el) => {
    let value: string;
    const key = kv[i].key;
    let links: Link[] = [];
    if ($(el).find('li').length > 0) {
      const value: string[] = [];
      $(el).find('li').each((_, li) => {
        value.push($(li).text());
        const href = $(li).find('a').attr("href");
        if (href) {
          links.push({
            relation: kv[i].key,
            domain: href.split('/')[2],
            id: href.split('/')[3],
            description: $(li).text(),
          });
        }
      });
      props.push({key , value, links});
      myMap.set(key,value);
    } else {
      myMap.set(key,[$(el).text()]);
    }
    i++;
  });

  interface AxiosResponse {
    data: string[];
  };


  console.log('Tables');
  const tables: Table[] = []
  // tables.push({name: 'DanceList', data: []});

  const tableData: TableRow[] = [];

  const axiosUrl = 'https://my.strathspey.org/dd/list/18849/ajax/dtab/?draw=1&columns%5B0%5D%5Bdata%5D=0&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=false&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=1&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=false&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=2&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=false&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=3&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=false&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=4&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=false&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=5&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=false&columns%5B5%5D%5Borderable%5D=false&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=6&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=false&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=0&order%5B0%5D%5Bdir%5D=asc&start=0&length=25&search%5Bvalue%5D=&search%5Bregex%5D=false&_=1753106420856'
  const response = await axios.get<AxiosResponse>(axiosUrl);
  const axiosData = response.data;
  const data = axiosData.data;
  console.log('333333');
  data.forEach((row,i) => {
    console.log(i);
    console.log(row);
    console.log(`0: ${row[0]}`);
    console.log(`1: ${row[1]}`);
    tableData.push({ data: [ 
      {key: 'LineNumber', value: [row[0]], links: []},
      {key: 'Name', value: [row[1]], links: []},
      {key: 'Type', value: [row[2]], links: []},
      {key: 'Shape', value: [row[3]], links: []},
      {key: 'Source', value: [row[4]], links: []},
      {key: 'Flags', value: [row[5]], links: []},
      {key: 'Comment', value: [row[6]], links: []},
    ]})
 
  });
  tables.push({name: 'DanceList', data: tableData});

  console.log(tableData);
  console.log(tableData[0].data);


  const s: Scrape = {
    scrapeType,
    id,
    name,
    extraInfo,
    props,
    tables,
  };

  cache.set(cacheKey, s);
  console.log(refresh ? '🔁 Forced refresh of data' : '📦 Scraped and saved to cache');

  return s;
}