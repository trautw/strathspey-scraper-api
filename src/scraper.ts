// src/scraper.ts
import axios from 'axios';
import * as cheerio from 'cheerio';
import NodeCache from 'node-cache';

interface Kv {
  key: string;
  value: string;
}

export interface Person {
  id: string;
  name: string;
  props: { key: string , value: string[] }[];
}

export interface Dance {
  id: string;
  name: string;
  props: { key: string , value: string[] }[];
}

const cache = new NodeCache({ stdTTL: 600 }); // 10-minute TTL

export async function scrapeDance(id: string, refresh = false): Promise<Person> {
  if (!refresh) {
    const cached = cache.get<Person>(`Person/${id}`);
    if (cached) {
      console.log('✅ Returning from cache');
      return cached;
    }
  }

  const url = `https://my.strathspey.org/dd/dance/${ id }/`;
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);
  const overview = $('#overview');
  const row = overview.find('.row');
  const name = $('#title').text();

  const kv: Kv[] = [];

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
    const linksKey = "Links:"+kv[i].key;
    if ($(el).find('li').length > 0) {
      const v: string[] = [];
      const links: string[] = [];
      $(el).find('li').each((_, li) => {
        v.push($(li).text());
        const href = $(li).find('a').attr("href");
        if (href) {
          links.push("strathspey:"+href);
        }
      });
      myMap.set(key,v);
      if (links.length > 0) {
        myMap.set(linksKey,links);
      }
    } else {
      myMap.set(key,[$(el).text()]);
    }
    i++;
  });

  const props: {key: string, value: string[]}[] = [];
  myMap.forEach((value, key) => {
    props.push({key , value});
  });

  const dance: Dance = {
    id,
    name,
    props
  };

  cache.set(`Dance/${id}`, dance);
  console.log(refresh ? '🔁 Forced refresh of data' : '📦 Scraped and saved to cache');

  return dance;
}
export async function scrapePerson(id: string, refresh = false): Promise<Person> {
  if (!refresh) {
    const cached = cache.get<Person>(`Person/${id}`);
    if (cached) {
      console.log('✅ Returning from cache');
      return cached;
    }
  }
  const url = `https://my.strathspey.org/dd/person/${ id }/`;
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);
  const overview = $('#overview');
  const row = overview.find('.row');
  const name = $('#title').text();

  const kv: Kv[] = [];

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
    const linksKey = "Links:"+kv[i].key;
    if ($(el).find('li').length > 0) {
      const v: string[] = [];
      const links: string[] = [];
      $(el).find('li').each((_, li) => {
        v.push($(li).text());
        const href = $(li).find('a').attr("href");
        if (href) {
          links.push("strathspey:"+href);
        }
      });
      myMap.set(key,v);
      if (links.length > 0) {
        myMap.set(linksKey,links);
      }
    } else {
      myMap.set(key,[$(el).text()]);
    }
    i++;
  });

  const props: {key: string, value: string[]}[] = [];
  myMap.forEach((value, key) => {
    props.push({key , value});
  });

  const person: Person = {
    id,
    name,
    props
  };

  cache.set(`Person/${id}`, person);
  console.log(refresh ? '🔁 Forced refresh of data' : '📦 Scraped and saved to cache');

  return person;
}