const functions = require('@google-cloud/functions-framework')
const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const {setTimeout} = require("node:timers/promises")


puppeteer.use(StealthPlugin())

const secret = process.env.SECRET

console.log('secret:', secret)

const localMode = process.env.LOCALMODE

functions.http('getHtmlFunction', async (req, res) => {

    // Check for Bearer token in the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${secret}`) {
        return res.status(403).send('Forbidden: Invalid token');
    }

    const url = decodeURIComponent(req.query.url);

    console.log('url:', url)

    if (!url) {
        return res.status(400).send('Missing required parameters');
    }

    console.log(`running`)


    let browser

    try {


        let launchOptions = localMode 
        ? {
            headless: true,
            args: ['--no-sandbox']
        }
        :{
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--disable-gpu'],
            executablePath: '/usr/bin/google-chrome-stable' // path to Google Chrome

        };

        // Launch the const 
        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();
        // disable javascript
        await page.setJavaScriptEnabled(false);


    
        // Navigate to the URL
        await page.goto(url, {waitUntil: 'load', timeout: 120000});

        console.log('content is loaded')

        await setTimeout(2000)




   
        /**** CONTENT ******/

        // get content text
        const textContent = await page.evaluate(() => {
            // Remove script and iframe tags
            const scripts = document.querySelectorAll('script, iframe');
            scripts.forEach(script => script.remove());

            // Get the main content
            const mainContent = document.querySelector('main') || document.querySelector('article') || document.body;
            return mainContent.innerHTML;
        });
        
  

        console.log('text content collected')
        console.log('closing browser')
        await browser.close();

        res.status(200).send(textContent);
        

    } catch (e) {
        
        console.log('caught error')
        console.log(e)
        console.log('closing browser')
        await browser.close();
        return res.status(500).send('Error processing request');
    }

    
})