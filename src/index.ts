import axios from 'axios';
import { createWriteStream } from 'fs';
import Path from 'path';
import cheerio, { Element, NodeWithChildren } from 'cheerio';
import { Stream } from 'stream';

const baseURL = 'http://www.blastwave-comic.com/';
/** in case getting image name from url fails - 'image' + imgCount */
const imgCount = 1;

async function FetchHTML(URL: string) {
  try {
    const response = await axios.get(URL);
    return await Promise.resolve<string>(response.data as string);
  } catch (error) {
    console.error(error);
    return;
  }
}

class SaveImage {
  imgURL: { current: string | undefined; toNext: string | undefined };
  constructor(html: string, nextImageIndex = 1) {
    this.imgURL = SaveImage.GetImageURL(html, nextImageIndex);
    if (typeof this.imgURL.current === 'string')
      SaveImage.DownloadImage(this.imgURL.current);
    else throw new Error("Couldn' get the comic image from the website");
  }
  /** Won't override already existing files */
  static DownloadImage(URL: string, outputName = '') {
    // Assuming existance of img type at the end of URL
    if (outputName === '')
      outputName = URL.split('/').pop() || `image${imgCount}`;

    if (URL.startsWith('.')) URL = URL.replace('.', baseURL);
    else if (URL.startsWith('/')) URL = baseURL + URL;

    axios
      .get(URL, { responseType: 'stream' })
      .then((response) => {
        const path = Path.resolve(process.cwd(), 'images', outputName);
        const writer = createWriteStream(path);
        const data = response.data as Stream;
        data.pipe(writer);
        return new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
      })
      .catch(console.error);
  }

  /**
   * @param left Wether the url for the next image will be
   on the 'previous' page or not */
  static GetImageURL(html: string, tdIndex = -1) {
    const $ = cheerio.load(html, { scriptingEnabled: false });
    // css selector for tr with data regarding links to different img
    // and yes, it's really that messy - this website rarely uses IDs
    const cssSelectors = {
      next: 'tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td',
      current: '#comic_ruutu > center:nth-child(1) > img:nth-child(2)',
    };

    // Gets the link to the current one; ex out: ./comics/078.jpg
    const current = $(cssSelectors.current).attr('src');
    // Gets the link to the next image
    let toNext;
    if (tdIndex > -1) {
      const td = $(cssSelectors.next)[tdIndex] as NodeWithChildren;
      const firstChild = td?.children[0] as Element;
      toNext = firstChild.attribs.href;
    }
    return { current, toNext };
  }

  static async andGetUrlToNext(URL: string) {
    const html = await FetchHTML(URL);
    if (typeof html !== 'string')
      throw new Error(`Didn't get a proper response from:\n${URL}`);

    const imgSave = new SaveImage(html);
    return imgSave.imgURL.toNext;
  }
}

async function main() {
  let urlToNextImg: string | undefined = baseURL;

  for (let index = 10; index > 0; index--) {
    urlToNextImg = await SaveImage.andGetUrlToNext(urlToNextImg);
    if (typeof urlToNextImg !== 'string')
      throw new Error("Coulnd't find url to next image");
    urlToNextImg = baseURL + urlToNextImg;
  }
}
main();
