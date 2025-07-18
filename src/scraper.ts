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

export interface Scrape {
  scrapeType: string;
  id: string;
  name: string;
  props: { key: string , value: string[], links: Link[] }[];
  extraInfo: string;
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
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);
  const overview = $('#overview');
  const row = overview.find('.row');
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

  const s: Scrape = {
    scrapeType,
    id,
    name,
    extraInfo,
    props,
  };

  cache.set(cacheKey, s);
  console.log(refresh ? '🔁 Forced refresh of data' : '📦 Scraped and saved to cache');

  return s;
}