// Import necessary modules
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// API endpoint to get all companies
app.get('/api/companies', async (req, res) => {
  try {
    const companies = await prisma.company.findMany();
    res.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

// API endpoint to create a company
app.post('/api/companies/create', async (req, res) => {
  try {
    const { name, websiteUrl } = req.body;
    console.log('POST /api/companies/create received:', { name, websiteUrl });

    const company = await findOrCreateCompanyByUrl(name, websiteUrl);
    console.log('Company created/found:', company);
    
    res.json(company);
  } catch (error) {
    console.error('Error creating company:', error);
    res.status(500).json({ error: 'Failed to create company' });
  }
});

// Serve static files from the dist directory
app.use(express.static('dist'));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Axios
import axios from 'axios';
const axiosInstance = axios.create({
    transformResponse: [function (data) {
    try {
        // Parse HTML content
        const $ = load(data);
  
        // Select only the desired tags and concatenate their HTML
        const cleanedContent = $('p, h1, h2, h3, h4, h5, h6, li, a, span') // Add any tags you want
          .map((_, el) => $(el).html().trim()) // Extract and trim HTML
          .get() // Convert Cheerio object to array
          .join(' '); // Join HTML with space
  
        return cleanedContent;
    } catch (error) {
        console.error('Error transforming response:', error);
            return data; // Return original data in case of failure
        }
    }]
});

// Cheerio
import { load } from 'cheerio';

// Turndown
import TurndownService from 'turndown';
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
});
turndownService.addRule('removeNonTextTags', {
    filter: ['script', 'style', 'noscript', 'iframe', 'meta', 'svg'],
    replacement: function () {
        return '';
    },
});
turndownService.addRule('cleanEmptyMarkdown', {
    filter: (node) => node.nodeType === 3 && !node.nodeValue.trim(),
    replacement: function () {
        return '';
    },
});

// OpenAI
import OpenAI from 'openai';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({apiKey: OPENAI_API_KEY});

// Prisma
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// Firecrawl
import FirecrawlApp from '@mendable/firecrawl-js';
import { z } from "zod";
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const firecrawl = new FirecrawlApp({apiKey: FIRECRAWL_API_KEY});

const schema = z.object({
    About: z.string(),
    Tags: z.array(z.string()),
    ShortDescription: z.string(),
    RegionServed: z.string()
});

console.log("- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -");

// Find or create company in database by URL
async function findOrCreateCompanyByUrl(companyName, websiteUrl) {
    let company = await prisma.company.findFirst({
        where: {
            WebsiteUrl: websiteUrl
        }
    });

    if (!company) {
        // Create a new company
        console.log("Creating new company with URL: " + websiteUrl);
        const newCompany = await prisma.company.create({
            data: { 
                Name: companyName,
                WebsiteUrl: websiteUrl,
            }
        });

        // Scrape the company's website
        console.log("Scraping company's website using axios...");
        const webpage = await scrapeWebpage(newCompany.WebsiteUrl, newCompany.Id);
        const allUrls = webpage.Urls;
        
        let topUrlsToScrape = [];
        if (allUrls.length > 0) {
            if (allUrls.length > 10) {
                console.log("Asking ChatGPT to pick the top 10 URLs to scrape.");
                // Ask ChatGPT to pick the top 10 URLs to scrape
                const urls_to_scrape = await ChatGPTRequest(
                    `Below is a list of URLs from the company's website:
                ${allUrls.map((u, i) => `${i + 1}. ${u}`).join('\n')}
            
                    Return up to 10 URLs that are most likely to contain content about the company, their services, and their business.
                    Do not include URLs that appear to be blog posts, login pages, privacy policies, or other non-content pages. Always include the homepage as the first URL.
                    Return the URLs in an array format, without using JSON.stringify().
                `, "gpt-4o-mini");
                console.log("URLs to scrape: " + urls_to_scrape + "\n\n");

                try {
                    topUrlsToScrape = JSON.parse(urls_to_scrape);
                } catch (error) {
                    console.error("Failed to parse URLs to scrape:", error);
                    topUrlsToScrape = []; // Fallback to an empty array
                }
            } else {
                console.log("Less than 10 URLs found. Scrape all URLs.\n\n");
                topUrlsToScrape = allUrls;
            }
        } else {
            console.log("No URLs to scrape");
        }

        // Update the company with the top 10 URLs to scrape
        await prisma.company.update({
            where: { Id: newCompany.Id },
            data: { UrlsToScrape: topUrlsToScrape }
        });
        let websiteContent = [];
        
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        let i = 1;
        for (const url of topUrlsToScrape) {
            await delay(2000); // Delay for 2 seconds
            console.log("Scraping URL " + i + " of " + topUrlsToScrape.length + ": " + url);
            const webpage = await scrapeWebpage(url, newCompany.Id);
            if(webpage.Content) {
                websiteContent.push(webpage.Content);
            }
            i++;
        }
        
        // Save the website content to the database
        if(websiteContent.length > 0) {
            console.log("Saving website content to the database.");
            // Combine all markdown content into a single string
            const combinedContent = websiteContent.map(item => item.markdown).join('<br><br>');

            await prisma.company.update({
                where: { Id: newCompany.Id },
                data: { WebsiteContent: combinedContent }
            });
        }

        return newCompany;
    }

    return company;
}

// This is the main function that kicks off the research for an org. 
// It will find or create the org in the database, then scrape the GuideStar profile, and then scrape the org's website.

//Scrape GuideStar nonprofit profile and save to database
async function scrapeGuideStarProfileByEin(ein) {
    let GuideStarScrapeResult = await firecrawl.scrapeUrl(`https://www.guidestar.org/profile/${ein}`, {
        formats: ["extract"],
        extract: { schema: GuideStarSchema }
    });
    console.log("GuideStarScrapeResult: \n\n" + JSON.stringify(GuideStarScrapeResult.extract, null, 2));
    return GuideStarScrapeResult.extract;
}

async function generateProfileFromWebsiteContent(websiteContent) {
    const prompt = 'Generate the following profile content from this website content using the following key value pairs: ' +
    'About\n' +
    'RegionServed\n' +
    'Tags\n' +
    'TagLine\n' +
    '\n' +
    'About should be a description of the organization\'s mission and purpose. ' +
    'Tags should be an array of tags that describe the organization\'s primary focus. ' +
    'TagLine should be a short, catchy phrase that describes the organization\'s mission and purpose using less than 120 characters. ' +
    'Return the data in JSON format. Only return the JSON, no other text or comments.\n' +
    'Here is the content: ' + websiteContent;
    const profileData = await ChatGPTRequest(prompt, "gpt-4o-mini");
    console.log("Profile data: " + profileData);
    return profileData;
}

async function ChatGPTRequest(prompt, model = "gpt-4o-mini") {
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [{ role: "user", content: prompt }]
        });
        
        const answer = response.choices[0].message.content;
        return answer;
    } catch (error) {
        console.error("Error interacting with ChatGPT:", error);
    }
}

// Function to get unique URLs from HTML
function get_unique_urls_from_html(html, starting_with_url) {
    const urls = [];
    const $ = load(html);
    $('a').each((index, a) => {
        const href = $(a).attr('href');
        if (!href) return;

        // Convert relative URLs to absolute
        const absoluteUrl = new URL(href, starting_with_url).href;

        // Check for unwanted URL patterns
        if (href.startsWith('#') || 
            href.startsWith('mailto:') || 
            href.startsWith('tel:') || 
            href.startsWith('data:') || 
            href.includes('#') || 
            href.startsWith('javascript:')) {
            return; // Skip unwanted URLs
        }

        // only add URL's that start with the org's website URL
        if(absoluteUrl.startsWith(starting_with_url)) {
            urls.push(absoluteUrl);
        }
    });
    return [...new Set(urls)]; // Return unique URLs
}

// Get unique images from HTML
function get_unique_images_from_html(html, baseUrl) {
    let images = [];
    const $ = load(html);
    
    // Extract image sources from <img> tags
    $('img').each((index, img) => {
        const src = $(img).attr('src');
        // Exclude base64 images
        if (src && !src.startsWith('data:image/')) images.push(src);
    });

    // Extract background image URLs from elements with a style attribute
    $('[style]').each((index, element) => {
        const style = $(element).attr('style');
        const backgroundImageMatch = style.match(/background-image:\s*url\(["']?([^"']+)["']?\)/);
        if (backgroundImageMatch && backgroundImageMatch[1]) {
            const bgImageUrl = backgroundImageMatch[1];
            // Exclude base64 images
            if (!bgImageUrl.startsWith('data:image/')) images.push(bgImageUrl);
        }
    });

    // Make sure image URL's are absolute
    images = images.map(image => new URL(image, baseUrl).href);

    return [...new Set(images)];
}

async function scrapeWebpage(url, companyId) {
    try {
        console.log(`Scraping webpage: ${url}`);
        
        // Check if webpage already exists in database
        const existingWebpage = await prisma.webpage.findFirst({
            where: {
                Url: url,
                CompanyId: companyId
            }
        });

        if (existingWebpage) {
            console.log("Webpage already exists in database");
            return existingWebpage;
        }

        // Scrape the webpage
        const response = await axiosInstance.get(url);
        const html = response.data;
        
        // Get unique URLs from the webpage
        const urls = get_unique_urls_from_html(html, url);
        
        // Convert HTML to Markdown
        const markdown = turndownService.turndown(html);
        
        // Create new webpage in database
        const webpage = await prisma.webpage.create({
            data: {
                Url: url,
                Html: html,
                Content: markdown,
                Urls: urls,
                CompanyId: companyId
            }
        });

        return webpage;
    } catch (error) {
        console.error(`Error scraping webpage ${url}:`, error);
        return null;
    }
}

// Function to scrape a URL and return HTML and Markdown
async function scrapeUrl(url_to_scrape) {
    try {
        const response = await firecrawl.scrapeUrl(url_to_scrape, {
            formats: ["markdown", "html"]
        });
        const markdown = response.markdown;
        const html = response.html;
        return { html, markdown };
    } catch (error) {
        console.error('Error fetching data:', error);
        return { html: null, markdown: null }; // Return nulls in case of error
    }
}

function formatMarkdown(content) {
    return content.split('\n').map(line => line.trim() ? line + '  ' : line).join('\n\n');
}

async function scrapeContent(url_to_scrape) {
    try {
        const response = await firecrawl.scrapeUrl(url_to_scrape, {
            formats: ["html"],
            excludeTags: ["header", "nav", "footer", "a", "img", "script", "style", "button", "table", "iframe", "meta", "svg"]
        });
        const pageTitle = response.metadata.title;
        return pageTitle ? `<h1>${pageTitle}</h1><br><br>${response.html}` : response.html;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null; // Return nulls in case of error
    }
}

// Function to scrape a URL and extract unique URLs
async function scrapeAndExtractUrls(url_to_scrape) {
    try {
        const { html, markdown } = await scrapeUrl(url_to_scrape);
        if (html) {
            const urls_on_page = get_unique_urls_from_html(html, url_to_scrape);
            return urls_on_page; // Return the extracted URLs
        }
        return [];
    } catch (error) {
        console.error('Error scraping and extracting URLs:', error);
        return [];
    }
}

console.log("- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -");

// const html = await scrapeContent("https://pastorserve.org/");
// const testContent = await generateProfileFromWebsiteContent(html);
// console.log("Test Content Type: " + typeof testContent);
// console.log("Test Content: " + testContent);