import axios from 'axios';
import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';
import qs from 'qs';
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
  columns: Prop[];
}
export interface Table {
  name: string;
  rows: TableRow[];
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
  props: Prop[]; 
  extraInfo: string;
  tables: Table[];
}

function getLinks($: cheerio.CheerioAPI ): Link[] {
  let links: Link[] = [];

  $('a').map((_, el) => {
    const href = el.attribs["href"];
    if (href) {
      const uri = href.replace(danceDatabaseUrl,'').replace('/dd','');
      links.push({
        relation: "aRelation",
        domain: uri.split('/')[1],
        id: uri.split('/')[2],
        description: $.text(),
      });
    }
  });
  return links;
}

function parseStringEntry(key: string, val: string ): Prop {
    let links: Link[] = [];
    const value: string[] = [];

    value.push(val);

    try {
      const $ = cheerio.load(val);
      links = getLinks($);
    } catch (error) {
      // console.log(`No html: ${val}`);
    };

  return {key, value, links};
}

const cache = new NodeCache({ stdTTL: 600 }); // 10-minute TTL

const danceDatabaseUrl = 'https://my.strathspey.org/dd';

export async function scrape(scrapeType: string, id: string, refresh: boolean): Promise<Scrape> {
  const cacheKey = scrapeType+'/'+id;
  if (!refresh) {
    const cached = cache.get<Scrape>(cacheKey);
    if (cached) {
      console.log('✅ Returning from cache');
      return cached;
    }
  }

  const url = `${ danceDatabaseUrl }/${scrapeType.toLowerCase()}/${ id }/`;
  console.log(`Scraping ${url}`);
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const tabContent = $('.tab-content');
  const $row = tabContent.find('.row');
  // console.log(`row = ${ $row }`);
  const name = $('#title').text();
  const extraInfo = $('#extrainfo').text();

  const kv: Kv[] = [];
  const props: {key: string, value: string[], links: Link[]}[] = [];

  $row.find('dt').map((_, el) => {
    const key = $(el).text();
    const value = "unset";
    kv.push({ key, value });
  });
  let i = 0;
  $row.find('dd').each((_, el) => {
    let value: string;
    const key = kv[i].key;
    let links: Link[] = [];
    if ($(el).find('li').length > 0) {
      const value: string[] = [];
      $(el).find('li').map((_, li) => {
        props.push(parseStringEntry(key,$(li.childNodes[0]).toString()));
      });
    }
    i++;
  });

  interface AxiosResponse {
    data: string[][];
  };


  const tables: Table[] = []
  const tableData: TableRow[] = [];
  const columnName: string[] = [];
  const headLine = $('#dtab > thead > tr');
  headLine.find('th').map((_, th) => {
    columnName.push($(th).text());
  });

  const axiosUrl = `${danceDatabaseUrl}/${scrapeType.toLowerCase()}/${ id }/ajax/dtab/?draw=1&columns%5B0%5D%5Bdata%5D=0&columns%5B0%5D%5Bname%5D=&columns%5B0%5D%5Bsearchable%5D=false&columns%5B0%5D%5Borderable%5D=false&columns%5B0%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B0%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B1%5D%5Bdata%5D=1&columns%5B1%5D%5Bname%5D=&columns%5B1%5D%5Bsearchable%5D=true&columns%5B1%5D%5Borderable%5D=false&columns%5B1%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B1%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B2%5D%5Bdata%5D=2&columns%5B2%5D%5Bname%5D=&columns%5B2%5D%5Bsearchable%5D=true&columns%5B2%5D%5Borderable%5D=false&columns%5B2%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B2%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B3%5D%5Bdata%5D=3&columns%5B3%5D%5Bname%5D=&columns%5B3%5D%5Bsearchable%5D=true&columns%5B3%5D%5Borderable%5D=false&columns%5B3%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B3%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B4%5D%5Bdata%5D=4&columns%5B4%5D%5Bname%5D=&columns%5B4%5D%5Bsearchable%5D=true&columns%5B4%5D%5Borderable%5D=false&columns%5B4%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B4%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B5%5D%5Bdata%5D=5&columns%5B5%5D%5Bname%5D=&columns%5B5%5D%5Bsearchable%5D=false&columns%5B5%5D%5Borderable%5D=false&columns%5B5%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B5%5D%5Bsearch%5D%5Bregex%5D=false&columns%5B6%5D%5Bdata%5D=6&columns%5B6%5D%5Bname%5D=&columns%5B6%5D%5Bsearchable%5D=true&columns%5B6%5D%5Borderable%5D=false&columns%5B6%5D%5Bsearch%5D%5Bvalue%5D=&columns%5B6%5D%5Bsearch%5D%5Bregex%5D=false&order%5B0%5D%5Bcolumn%5D=0&order%5B0%5D%5Bdir%5D=asc&start=0&length=25&search%5Bvalue%5D=&search%5Bregex%5D=false&_=1753106420856`;
  console.log('Calling axios');
  // const response = await axios.get<AxiosResponse>(axiosUrl);
  try {
    const response = await axios.get<AxiosResponse>(axiosUrl);
    const axiosData = response.data;
    const data = axiosData.data;
    data.forEach((row,i) => {
      const d: Prop[]= [];
      columnName.map((name, i) => {
        d.push(parseStringEntry(name, row[i]));
      });
      tableData.push( {columns: d});
    });
    tables.push({name: scrapeType, rows: tableData});
  } catch {
    console.log('Axios call error');
  }

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

export async function searchDance(scrapeType: string, author: string, refresh: boolean): Promise<Scrape> {
  // csrfmiddlewaretoken=6gakuVxTqmxQ3Ewymolr7csJfeQJymGscjisc40mEg3Wtw7l566QDljagEFw6Iyc&name_pattern=&type=&bars_op=exact&bars_value=&medleytype=&couples=&shape=&progression=&author=Stolte&form1=&form2op=and&form2=&form3op=and&form3=&step1=&step2op=and&step2=&step3op=and&step3=&lists=&collection=-1
  const postData = {
    author,
    csrfmiddlewaretoken: '6gakuVxTqmxQ3Ewymolr7csJfeQJymGscjisc40mEg3Wtw7l566QDljagEFw6Iyc',
    name_pattern: '',
    type: '',
    bars_op: '',
    exact: '',
    bars_value: '',
    medleytype: '',
    couples: '',
    shape: '',
    progression: '',
    lists: '',
    collection: '-1'
  };

  const query = 'csrfmiddlewaretoken=6gakuVxTqmxQ3Ewymolr7csJfeQJymGscjisc40mEg3Wtw7l566QDljagEFw6Iyc&name_pattern=&type=&bars_op=exact&bars_value=&medleytype=&couples=&shape=&progression=&author=Stolte&form1=&form2op=and&form2=&form3op=and&form3=&step1=&step2op=and&step2=&step3op=and&step3=&lists=&collection=-1';
  const query2 = qs.stringify(postData);
  console.log(`q = ${ query2 }`);

await axios.post(`${ danceDatabaseUrl }/search/dance/`, query, {
  headers: {
    'content-type': 'application/x-www-form-urlencoded',
    'origin': 'https://my.strathspey.org',
    'cookie': 'ace4_consent=+maps|+youtube|+vimeo; csrftoken=gdiiSjDDo4GgA2LXTSVzGj1BbAZXIw2U; sessionid=9yjj42jiogei7wz7kex563mi3flkl4ry'
  }
})
.then(response => {
  // console.log(response.data)
  const $ = cheerio.load(response.data);
  const tabContent = $('#dtab');
  console.log(`table = ${ tabContent.text() }`);
})
.catch(error => console.error('Error:', error));

  const s: Scrape = {
      scrapeType,
      id: "aId",
      name: "aName",
      extraInfo: "aExtraInfo",
      props: [],
      tables: [],
  };
  return s;
}