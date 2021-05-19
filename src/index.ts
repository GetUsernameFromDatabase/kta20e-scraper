import axios from 'axios';
import cheerio from 'cheerio';

const baseURL = 'http://www.blastwave-comic.com/';

function FetchHTML(URL: string) {
  return axios
    .get(URL)
    .then((response) => Promise.resolve<string>(response.data))
    .catch((error) => Promise.reject<Error>(error));
}

/** Won't override already existing files */
function DownloadImage(URL: string, outputName = '') {
  if (URL.startsWith('.')) URL = URL.replace('.', baseURL);
  // TODO
}

function GetDifferentImage(html: string, nextImage = false) {
  // TODO
}

async function main() {
  const initialRequest = await FetchHTML(baseURL);
  const $ = cheerio.load(initialRequest, { scriptingEnabled: false });
}
main();
